# Claude Code routing core - single source of routing behavior.
# Dot-sourced by build-claude-code.ps1 (fixture, human output) and
# build-claude-code-production.ps1 (production, JSON output).
# Version authority for the adapter implementation.
# Version 0.3.0: env-only surgical scope + model roles. The builder patches
# the top-level `env` object and two managed top-level keys (availableModels,
# enforceAvailableModels) using exact character spans; every unrelated byte is
# preserved. Managed env fields gain ANTHROPIC_DEFAULT_OPUS/SONNET/HAIKU/FABLE_MODEL.

$script:CLAUDE_ROUTING_CORE_VERSION = "0.3.0"

function Fail { param([string]$Reason) throw $Reason }
function Get-Canonical { param([string]$Path) [IO.Path]::GetFullPath($Path) }
function Get-ClaudeSha256 {
    param([Parameter(Mandatory=$true)][string]$Path)
    $hasher=[Security.Cryptography.SHA256]::Create()
    try{
        return ([BitConverter]::ToString($hasher.ComputeHash([IO.File]::ReadAllBytes($Path)))).Replace("-","").ToLowerInvariant()
    }finally{$hasher.Dispose()}
}
function Assert-NoReparseComponent { param([string]$Path,[string]$Boundary)
    $boundaryPrefix=$Boundary.TrimEnd('\')+'\'; if(!$Path.StartsWith($boundaryPrefix,[StringComparison]::OrdinalIgnoreCase)-and $Path-cne $Boundary){Fail "physical path boundary violation"}
    $cursor=$Boundary
    if(Test-Path -LiteralPath $cursor){$entry=Get-Item -LiteralPath $cursor -Force; if(($entry.Attributes-band [IO.FileAttributes]::ReparsePoint)-ne 0){Fail "reparse point rejected"}}
    if($Path-cne $Boundary){foreach($part in $Path.Substring($boundaryPrefix.Length).Split([IO.Path]::DirectorySeparatorChar)){if([string]::IsNullOrEmpty($part)){continue};$cursor=Join-Path $cursor $part;if(Test-Path -LiteralPath $cursor){$entry=Get-Item -LiteralPath $cursor -Force;if(($entry.Attributes-band [IO.FileAttributes]::ReparsePoint)-ne 0){Fail "reparse point rejected"}}}}
}
function Assert-NoDuplicateKeys { param([string]$Raw)
    $contexts=New-Object System.Collections.Stack; $i=0
    while($i-lt $Raw.Length){
        $c=$Raw[$i]
        if([char]::IsWhiteSpace($c)){$i++;continue}
        if($c-eq '{'){$contexts.Push([pscustomobject]@{Type='object';ExpectKey=$true;Keys=(New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::Ordinal))});$i++;continue}
        if($c-eq '['){$contexts.Push([pscustomobject]@{Type='array';ExpectKey=$false;Keys=$null});$i++;continue}
        if($c-eq '}'-or $c-eq ']'){if($contexts.Count){[void]$contexts.Pop()};$i++;continue}
        if($c-eq ','){if($contexts.Count-and $contexts.Peek().Type-eq 'object'){$contexts.Peek().ExpectKey=$true};$i++;continue}
        if($c-eq ':'){$i++;continue}
        if($c-eq '"'){
            $start=$i;$i++;$escaped=$false
            while($i-lt $Raw.Length){$ch=$Raw[$i];if($escaped){$escaped=$false;$i++;continue};if($ch-eq '\'){$escaped=$true;$i++;continue};if($ch-eq '"'){$i++;break};$i++}
            $token=$Raw.Substring($start,$i-$start);try{$decoded=$token|ConvertFrom-Json}catch{Fail "invalid JSON string token"}
            if($contexts.Count-and $contexts.Peek().Type-eq 'object'-and $contexts.Peek().ExpectKey){if(!$contexts.Peek().Keys.Add([string]$decoded)){Fail "duplicate key"};$contexts.Peek().ExpectKey=$false}
            continue
        }
        while($i-lt $Raw.Length-and $Raw[$i]-notin @(',',']','}')){$i++}
    }
}
function Read-Json { param([string]$Path,[string]$Label) $raw=[IO.File]::ReadAllText($Path); Assert-NoDuplicateKeys $raw; try{$obj=$raw|ConvertFrom-Json}catch{Fail "$Label malformed JSON"}; if(!($obj-is [Management.Automation.PSCustomObject])){Fail "$Label root must be object"}; [pscustomobject]@{Raw=$raw;Object=$obj} }
function Has-Property { param([object]$Object,[string]$Name) $null-ne $Object.PSObject.Properties[$Name] }
function Require-Type { param([object]$Value,[type]$Type,[string]$Name) if($null-eq $Value-or !($Value-is $Type)){Fail "$Name invalid type"} }
function Get-JsonType { param([object]$Value) if($null-eq $Value){"null"}elseif($Value-is[bool]){"boolean"}elseif($Value-is[string]){"string"}elseif($Value-is[int]-or $Value-is[long]){"integer"}elseif($Value-is[decimal]-or $Value-is[double]-or $Value-is[single]){"number"}elseif($Value-is[Management.Automation.PSCustomObject]){"object"}elseif($Value-is[Collections.IEnumerable]){"array"}else{"object"} }
function Test-SchemaValue { param([object]$Value,[object]$Node,[string]$Path,[Collections.ArrayList]$Errors)
    if($Node.PSObject.Properties['type']){$actual=Get-JsonType $Value;if(@($Node.type)-notcontains $actual){[void]$Errors.Add("$Path type mismatch");return}}
    if($Node.PSObject.Properties['enum']){$match=$false;foreach($allowed in @($Node.enum)){if((Convert-Semantic $allowed)-ceq(Convert-Semantic $Value)){$match=$true;break}};if(!$match){[void]$Errors.Add("$Path enum mismatch")}}
    if($Node.PSObject.Properties['const']){if((Convert-Semantic $Node.const)-cne(Convert-Semantic $Value)){[void]$Errors.Add("$Path const mismatch")}}
    if($Value-is[Management.Automation.PSCustomObject]){
        if($Node.PSObject.Properties['required']){foreach($required in @($Node.required)){if(!(Has-Property $Value $required)){[void]$Errors.Add("$Path.$required required")}}}
        if($Node.PSObject.Properties['properties']){foreach($property in $Value.PSObject.Properties){$propertySchema=$Node.properties.PSObject.Properties[$property.Name];if($null-eq $propertySchema){if($Node.PSObject.Properties['additionalProperties']-and $Node.additionalProperties-eq $false){[void]$Errors.Add("$Path.$($property.Name) unsupported")}}else{Test-SchemaValue $property.Value $propertySchema.Value "$Path.$($property.Name)" $Errors}}}
    }
    if($Value-is[Collections.IEnumerable]-and !($Value-is[string])-and $Node.PSObject.Properties['items']){$index=0;foreach($item in $Value){Test-SchemaValue $item $Node.items "$Path[$index]" $Errors;$index++}}
    if($Node.PSObject.Properties['allOf']){foreach($sub in @($Node.allOf)){Test-SchemaValue $Value $sub "$Path(allOf)" $Errors}}
    if($Node.PSObject.Properties['not']){$subErrors=New-Object Collections.ArrayList;Test-SchemaValue $Value $Node.not "$Path(not)" $subErrors;if($subErrors.Count-eq 0){[void]$Errors.Add("$Path forbidden combination")}}
}
function Assert-SchemaCompliance { param([object]$Route,[object]$Schema) $errors=New-Object Collections.ArrayList;Test-SchemaValue $Route $Schema '(root)' $errors;if($errors.Count){Fail ("schema validation failed: "+($errors-join '; '))} }
function Validate-Inputs { param([object]$Route,[object]$Settings)
    function Assert-PropertySet { param([object]$Object,[string[]]$Allowed,[string]$Label) foreach($p in $Object.PSObject.Properties){if($Allowed-notcontains $p.Name){Fail "$Label unsupported property"}} }
    Assert-PropertySet $Route @("target","scope","endpoint","model","modelRoles","restrictModelPicker","envPolicy") "routing"
    if($Route.target-cne "claude-code"){Fail "unsupported target"}; if($Route.scope-cne "user"){Fail "unsupported scope"}
    foreach($n in @("endpoint","model","modelRoles","restrictModelPicker","envPolicy")){if(!(Has-Property $Route $n)){Fail "missing routing property"}}
    Require-Type $Route.endpoint ([Management.Automation.PSCustomObject]) "endpoint"; Require-Type $Route.endpoint.auth ([Management.Automation.PSCustomObject]) "auth"
    Assert-PropertySet $Route.endpoint @("baseUrl","auth") "endpoint"; Assert-PropertySet $Route.endpoint.auth @("apiKeySecretRef","authTokenSecretRef") "auth"; Assert-PropertySet $Route.model @("value","source") "model"; Assert-PropertySet $Route.envPolicy @("gatewayDiscovery","disableExperimentalBetas","autoCompactWindow","disableNonessentialTraffic") "policy"
    Require-Type $Route.modelRoles ([Management.Automation.PSCustomObject]) "modelRoles"; Assert-PropertySet $Route.modelRoles @("opus","sonnet","haiku","fable") "modelRoles"
    foreach($role in @("opus","sonnet","haiku","fable")){if(Has-Property $Route.modelRoles $role){if(!($Route.modelRoles.$role-is [string])-or [string]::IsNullOrWhiteSpace($Route.modelRoles.$role)){Fail "model role invalid"}}}
    if(!($Route.restrictModelPicker-is [bool])){Fail "restrictModelPicker invalid"}
    $hasApi=Has-Property $Route.endpoint.auth "apiKeySecretRef"; $hasToken=Has-Property $Route.endpoint.auth "authTokenSecretRef"
    if($hasApi-eq $hasToken){Fail "exactly one auth strategy required"}; $ref=if($hasApi){$Route.endpoint.auth.apiKeySecretRef}else{$Route.endpoint.auth.authTokenSecretRef}
    if(!($ref-is [string])-or $ref-notmatch '^[A-Za-z_][A-Za-z0-9_]*$'){Fail "invalid secret reference"}
    $secret=[Environment]::GetEnvironmentVariable($ref,"Process"); if([string]::IsNullOrEmpty($secret)){Fail "referenced secret missing"}
    if(!($Route.endpoint.baseUrl-is [string])){Fail "base URL invalid"}; $uri=$null; $uriValid=[Uri]::TryCreate($Route.endpoint.baseUrl,[UriKind]::Absolute,[ref]$uri); if(!$uriValid-or (@("http","https")-notcontains $uri.Scheme)-or [string]::IsNullOrEmpty($uri.Host)-or ![string]::IsNullOrEmpty($uri.UserInfo)-or ![string]::IsNullOrEmpty($uri.Query)-or ![string]::IsNullOrEmpty($uri.Fragment)){Fail "base URL invalid"}
    if(!($Route.model.value-is [string])-or [string]::IsNullOrWhiteSpace($Route.model.value)){Fail "model invalid"}; if($Route.model.source-cne "environment"){Fail "model source invalid"}
    if(Has-Property $Route.envPolicy "autoCompactWindow"){$w=$Route.envPolicy.autoCompactWindow; if(!($w-is [int])-and !($w-is [long])){Fail "auto compact must be integer"}; if($w-lt 100000-or $w-gt 1000000){Fail "auto compact out of range"}}
    foreach($n in @("gatewayDiscovery","disableExperimentalBetas","disableNonessentialTraffic")){if(!(Has-Property $Route.envPolicy $n)-or !($Route.envPolicy.$n-is [bool])){Fail "policy invalid"}}
    if($Route.envPolicy.gatewayDiscovery-and $Route.envPolicy.disableNonessentialTraffic){Fail "Gateway model discovery cannot be combined with disabled nonessential traffic."}
    if(Has-Property $Settings "env"){Require-Type $Settings.env ([Management.Automation.PSCustomObject]) "settings env"}
    [pscustomobject]@{HasApi=$hasApi;Secret=$secret}
}
function Convert-Semantic { param([object]$Value)
    if($null-eq $Value){return "N"}; if($Value-is [bool]){return "B:"+[string]$Value}; if($Value-is [string]){return "S:"+$Value.Length+":"+$Value}; if($Value-is [ValueType]){return "D:"+$Value.GetType().FullName+":"+$Value.ToString([Globalization.CultureInfo]::InvariantCulture)}
    if($Value-is [Array]){return "A["+(($Value|ForEach-Object {Convert-Semantic $_})-join "|")+"]"}
    if($Value-is [Management.Automation.PSCustomObject]){$parts=@(); foreach($p in @($Value.PSObject.Properties|Sort-Object Name)){$parts+=$p.Name.Length.ToString()+":"+$p.Name+"="+(Convert-Semantic $p.Value)}; return "O{"+($parts-join "|")+"}"}; Fail "unsupported semantic type"
}
function Get-UnsupportedSnapshot { param([object]$Settings)
    $root=[ordered]@{}; foreach($p in $Settings.PSObject.Properties){if($p.Name-notin @("env","availableModels","enforceAvailableModels")){$root[$p.Name]=$p.Value}}
    $env=[ordered]@{}; $managed=@("ANTHROPIC_BASE_URL","ANTHROPIC_API_KEY","ANTHROPIC_AUTH_TOKEN","ANTHROPIC_MODEL","CLAUDE_CODE_AUTO_COMPACT_WINDOW","CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY","CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS","CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC","ANTHROPIC_DEFAULT_OPUS_MODEL","ANTHROPIC_DEFAULT_SONNET_MODEL","ANTHROPIC_DEFAULT_HAIKU_MODEL","ANTHROPIC_DEFAULT_FABLE_MODEL"); if(Has-Property $Settings "env"){foreach($p in $Settings.env.PSObject.Properties){if($managed-notcontains $p.Name){$env[$p.Name]=$p.Value}}}
    Convert-Semantic ([pscustomobject]@{root=[pscustomobject]$root;env=[pscustomobject]$env})
}
function Get-RouteAllowList { param([object]$Route)
    # Derived /model picker allowlist: main model first, then the four role
    # models in fixed alias order, deduplicated (first occurrence wins).
    $list=New-Object System.Collections.ArrayList
    $candidates=New-Object System.Collections.ArrayList
    [void]$candidates.Add($Route.model.value)
    foreach($role in @("opus","sonnet","haiku","fable")){if(Has-Property $Route.modelRoles $role){[void]$candidates.Add($Route.modelRoles.$role)}}
    foreach($candidate in $candidates){if($candidate-and ($list-notcontains $candidate)){[void]$list.Add($candidate)}}
    return ,$list
}
function ConvertTo-JsonValueLiteral { param([object]$Value)
    # String, boolean, and array-of-strings literal writer with round-trip check.
    if($Value-is [bool]){return ([string]$Value).ToLowerInvariant()}
    if($Value-is [string]){return ConvertTo-JsonStringLiteral $Value}
    if($Value-is [Collections.IEnumerable]-and !($Value-is [string])){$parts=@(); foreach($item in $Value){$parts+=ConvertTo-JsonStringLiteral ([string]$item)}; $literal='['+($parts-join ',')+']'; try{$round=$literal|ConvertFrom-Json}catch{Fail "array literal serialization failed"}; if(@($round).Count-ne @($Value).Count){Fail "array literal round-trip mismatch"}; return $literal}
    Fail "unsupported managed value literal"
}
function Verify-Contract { param([object]$Settings,[object]$Route,[object]$Auth,[string]$Unsupported)
    if((Get-UnsupportedSnapshot $Settings)-cne $Unsupported){Fail "unsupported values changed"}
    if($Settings.env.ANTHROPIC_MODEL-cne $Route.model.value-or $Settings.env.ANTHROPIC_BASE_URL-cne $Route.endpoint.baseUrl){Fail "route verification failed"}
    $selected=if($Auth.HasApi){"ANTHROPIC_API_KEY"}else{"ANTHROPIC_AUTH_TOKEN"}; $opposite=if($Auth.HasApi){"ANTHROPIC_AUTH_TOKEN"}else{"ANTHROPIC_API_KEY"}; if(($Settings.env.$selected-cne $Auth.Secret)-or (Has-Property $Settings.env $opposite)){Fail "auth verification failed"}
    if(Has-Property $Route.envPolicy "autoCompactWindow"){if($Settings.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW-cne ([string]$Route.envPolicy.autoCompactWindow)){Fail "auto compact verification failed"}}elseif(Has-Property $Settings.env "CLAUDE_CODE_AUTO_COMPACT_WINDOW"){Fail "auto compact absence verification failed"}
    foreach($pair in @(@("CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY","gatewayDiscovery"),@("CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS","disableExperimentalBetas"),@("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC","disableNonessentialTraffic"))){$present=Has-Property $Settings.env $pair[0];if($Route.envPolicy.($pair[1])){if(!$present-or $Settings.env.($pair[0])-cne "1"){Fail "policy verification failed"}}elseif($present){Fail "policy absence verification failed"}}
    foreach($role in @("opus","sonnet","haiku","fable")){$envName="ANTHROPIC_DEFAULT_"+$role.ToUpper()+"_MODEL";$present=Has-Property $Settings.env $envName;if(Has-Property $Route.modelRoles $role){if(!$present-or $Settings.env.$envName-cne $Route.modelRoles.$role){Fail "model role verification failed"}}elseif($present){Fail "model role absence verification failed"}}
    $allow=Get-RouteAllowList $Route
    if($Route.restrictModelPicker){
        if(!(Has-Property $Settings "availableModels")-or (@($Settings.availableModels)-join '|')-ne (@($allow)-join '|')){Fail "allowlist verification failed"}
        if(!(Has-Property $Settings "enforceAvailableModels")-or $Settings.enforceAvailableModels-cne $true){Fail "enforce allowlist verification failed"}
    }else{
        if(Has-Property $Settings "availableModels"){Fail "allowlist absence verification failed"}
        if(Has-Property $Settings "enforceAvailableModels"){Fail "enforce allowlist absence verification failed"}
    }
}
function Write-Utf8File { param([string]$Path,[string]$Text) $stream=[IO.File]::Open($Path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None); try{$bytes=[Text.UTF8Encoding]::new($false).GetBytes($Text);$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()} }
function Restore-Backup { $restore=Join-Path (Split-Path $script:SettingsPath -Parent) (".bdf-transaction-restore-"+[guid]::NewGuid().ToString("N")+".tmp"); $discard=$restore+".old"; try{[IO.File]::Copy($script:backupPath,$restore,$false); [IO.File]::Replace($restore,$script:SettingsPath,$discard); if(Test-Path $discard){Remove-Item $discard -Force}; $a=[IO.File]::ReadAllBytes($script:backupPath);$b=[IO.File]::ReadAllBytes($script:SettingsPath);if((Convert-Semantic $a)-cne(Convert-Semantic $b)){Fail "restore bytes differ"}; Read-Json $script:SettingsPath "restored target"|Out-Null}finally{if(Test-Path $restore){Remove-Item $restore -Force};if(Test-Path $discard){Remove-Item $discard -Force}} }

# ---------------------------------------------------------------------------
# Surgical env-only settings patcher (version 0.2.0).
# Reads bytes once, tokenizes exact character spans, applies validated edits,
# and never serializes the whole settings object.
# ---------------------------------------------------------------------------

function Read-SettingsDocument {
    param([string]$Path)
    $bytes=[IO.File]::ReadAllBytes($Path)
    $hasBom=$false
    $decodeStart=0
    if($bytes.Length-ge 3-and $bytes[0]-eq 0xEF-and $bytes[1]-eq 0xBB-and $bytes[2]-eq 0xBF){$hasBom=$true;$decodeStart=3}
    $raw=$null
    try{
        $encoding=New-Object System.Text.UTF8Encoding($false,$true)
        if($decodeStart-gt 0){
            $payload=New-Object byte[] ($bytes.Length-$decodeStart)
            [Array]::Copy($bytes,$decodeStart,$payload,0,$payload.Length)
            $raw=$encoding.GetString($payload)
        }else{
            $raw=$encoding.GetString($bytes)
        }
    }catch{Fail "settings not strict UTF-8"}
    Assert-NoDuplicateKeys $raw
    $obj=$null
    try{$obj=$raw|ConvertFrom-Json}catch{Fail "settings malformed JSON"}
    if(!($obj-is [Management.Automation.PSCustomObject])){Fail "settings root must be object"}
    $lineEnding="NONE"
    if($raw.Contains("`r`n")){$lineEnding="CRLF"}elseif($raw.Contains("`n")){$lineEnding="LF"}
    $hasTrailingNewline=$raw.EndsWith("`n")
    [pscustomobject]@{RawText=$raw;ParsedObject=$obj;HasUtf8Bom=$hasBom;LineEnding=$lineEnding;HasTrailingNewline=$hasTrailingNewline;OriginalBytes=$bytes}
}

function Skip-JsonWhitespace { param([string]$Raw,[int]$Index) while($Index-lt $Raw.Length-and [char]::IsWhiteSpace($Raw[$Index])){$Index++};return $Index }

function Read-JsonStringToken { param([string]$Raw,[int]$Index,[ref]$EndIndex)
    # Index must point at the opening quote. Returns decoded string; sets EndIndex after closing quote.
    $start=$Index;$i=$Index+1;$escaped=$false
    while($i-lt $Raw.Length){$ch=$Raw[$i];if($escaped){$escaped=$false;$i++;continue};if($ch-eq '\'){$escaped=$true;$i++;continue};if($ch-eq '"'){$i++;break};$i++}
    if($i-ge $Raw.Length){Fail "unterminated string token"}
    $token=$Raw.Substring($start,$i-$start)
    try{$decoded=$token|ConvertFrom-Json}catch{Fail "invalid JSON string token"}
    $EndIndex.Value=$i
    return [string]$decoded
}

function Read-JsonValueToken { param([string]$Raw,[int]$Index,[ref]$EndIndex)
    # Reads one value token (number/bool/null/string) or a bracketed value span.
    $i=$Index
    if($i-ge $Raw.Length){Fail "unexpected end of JSON"}
    $c=$Raw[$i]
    if($c-eq '"'){
        $end=$i
        [void](Read-JsonStringToken $Raw $i ([ref]$end))
        $EndIndex.Value=$end
        return
    }
    if($c-eq '{'-or $c-eq '['){
        $depth=0
        while($i-lt $Raw.Length){
            $ch=$Raw[$i]
            if($ch-eq '"'){$end=$i;[void](Read-JsonStringToken $Raw $i ([ref]$end));$i=$end;continue}
            if($ch-eq '{'-or $ch-eq '['){$depth++}
            elseif($ch-eq '}'-or $ch-eq ']'){$depth--;if($depth-eq 0){$i++;break}}
            $i++
        }
        if($depth-ne 0){Fail "unbalanced JSON container"}
        $EndIndex.Value=$i
        return
    }
    while($i-lt $Raw.Length-and $Raw[$i]-notin @(',','}',']')-and ![char]::IsWhiteSpace($Raw[$i])){$i++}
    if($i-eq $Index){Fail "unexpected JSON token"}
    $EndIndex.Value=$i
}

function Get-SettingsJsonLayout {
    param([string]$Raw)
    # Recursive lexical layout: records spans for root members and, when
    # present, the top-level `env` object and its direct members.
    # Returns @{ RootOpen; RootClose; RootMembers; Env; EnvMembers; RootIndent; EnvIndent; HasEnv }
    $rootOpen=-1;$rootClose=-1
    $i=Skip-JsonWhitespace $Raw 0
    if($i-ge $Raw.Length-or $Raw[$i]-cne '{'){Fail "settings root must be an object"}
    $rootOpen=$i
    $rootMembers=New-Object System.Collections.ArrayList
    $env=$null
    $envMembers=New-Object System.Collections.ArrayList

    $i++
    $prevCommaStart=-1
    while($i-lt $Raw.Length){
        $i=Skip-JsonWhitespace $Raw $i
        if($i-ge $Raw.Length){Fail "unterminated settings object"}
        $c=$Raw[$i]
        if($c-eq '}'){$rootClose=$i;$i++;break}
        $keyStart=$i
        $keyEnd=$keyStart
        $keyName=Read-JsonStringToken $Raw $i ([ref]$keyEnd)
        $i=Skip-JsonWhitespace $Raw $keyEnd
        if($i-ge $Raw.Length-or $Raw[$i]-cne ':'){Fail "expected colon after key"}
        $colonEnd=$i+1
        $i=Skip-JsonWhitespace $Raw $colonEnd
        $valueStart=$i
        $valueEnd=$valueStart
        Read-JsonValueToken $Raw $i ([ref]$valueEnd)
        $i=$valueEnd
        $commaStart=-1
        $hasComma=$false
        $ws=$i
        $i=Skip-JsonWhitespace $Raw $i
        if($i-lt $Raw.Length-and $Raw[$i]-eq ','){$commaStart=$i;$hasComma=$true;$i++}
        $member=[pscustomobject]@{KeyName=$keyName;KeyStart=$keyStart;KeyLength=($keyEnd-$keyStart);ValueStart=$valueStart;ValueLength=($valueEnd-$valueStart);CommaStart=$commaStart;HasCommaAfter=$hasComma;PrevCommaStart=$prevCommaStart}
        [void]$rootMembers.Add($member)
        $prevCommaStart=$commaStart
        if($keyName-eq "env"-and $valueStart-lt $Raw.Length-and $Raw[$valueStart]-eq '{'){
            # parse env object members
            $envOpen=$valueStart
            $envClose=-1
            $j=$valueStart+1
            $envPrevComma=-1
            while($j-lt $Raw.Length){
                $j=Skip-JsonWhitespace $Raw $j
                if($j-ge $Raw.Length){Fail "unterminated env object"}
                $ec=$Raw[$j]
                if($ec-eq '}'){$envClose=$j;$j++;break}
                $ekStart=$j
                $ekEnd=$ekStart
                $ekName=Read-JsonStringToken $Raw $j ([ref]$ekEnd)
                $j=Skip-JsonWhitespace $Raw $ekEnd
                if($j-ge $Raw.Length-or $Raw[$j]-cne ':'){Fail "expected colon in env object"}
                $j++
                $j=Skip-JsonWhitespace $Raw $j
                $evStart=$j
                $evEnd=$evStart
                Read-JsonValueToken $Raw $j ([ref]$evEnd)
                $j=$evEnd
                $ecComma=-1
                $ecHas=$false
                $j=Skip-JsonWhitespace $Raw $j
                if($j-lt $Raw.Length-and $Raw[$j]-eq ','){$ecComma=$j;$ecHas=$true;$j++}
                $em=[pscustomobject]@{KeyName=$ekName;KeyStart=$ekStart;KeyLength=($ekEnd-$ekStart);ValueStart=$evStart;ValueLength=($evEnd-$evStart);CommaStart=$ecComma;HasCommaAfter=$ecHas;PrevCommaStart=$envPrevComma}
                [void]$envMembers.Add($em)
                $envPrevComma=$ecComma
            }
            if($envClose-lt 0){Fail "unterminated env object"}
            $env=[pscustomobject]@{Open=$envOpen;Close=$envClose}
        }
        if(-not $hasComma){$i=Skip-JsonWhitespace $Raw $i;if($i-lt $Raw.Length-and $Raw[$i]-eq '}'){continue}}
    }
    if($rootClose-lt 0){Fail "unterminated settings object"}

    function Get-MemberIndent { param([string]$RawText,[object]$Member)
        if($null-eq $Member){return ""}
        $lineStart=$RawText.LastIndexOf("`n",[Math]::Max(0,$Member.KeyStart-1))
        if($lineStart-lt 0){$lineStart=0}else{$lineStart++}
        $prefix=$RawText.Substring($lineStart,$Member.KeyStart-$lineStart)
        if($prefix.Trim().Length-gt 0){return ""}
        return $prefix
    }
    $rootIndent=""
    if($rootMembers.Count){$rootIndent=Get-MemberIndent $Raw $rootMembers[0]}
    $envIndent=""
    if($envMembers.Count){$envIndent=Get-MemberIndent $Raw $envMembers[0]}
    [pscustomobject]@{RootOpen=$rootOpen;RootClose=$rootClose;RootMembers=$rootMembers;HasEnv=($null-ne $env);Env=$env;EnvMembers=$envMembers;RootIndent=$rootIndent;EnvIndent=$envIndent}
}

function ConvertTo-JsonStringLiteral {
    param([string]$Value)
    $builder=New-Object Text.StringBuilder
    [void]$builder.Append('"')
    foreach($ch in $Value.ToCharArray()){
        $code=[int]$ch
        if($ch-eq '"'){[void]$builder.Append('\'+'"')}
        elseif($ch-eq '\'){[void]$builder.Append('\\')}
        elseif($code-lt 0x20){
            [void]$builder.Append(('\u'+$code.ToString('x4')))
        }
        else{[void]$builder.Append($ch)}
    }
    [void]$builder.Append('"')
    $token=$builder.ToString()
    try{$roundTrip=$token|ConvertFrom-Json}catch{Fail "string literal serialization failed"}
    if([string]$roundTrip-cne $Value){Fail "string literal round-trip mismatch"}
    return $token
}

function New-SettingsEnvEdits {
    param([object]$Document,[object]$Route,[object]$Auth)
    # Produces an ordered edit list. Each edit: Start, Length, Replacement, ManagedName.
    $raw=$Document.RawText
    $layout=Get-SettingsJsonLayout -Raw $raw
    $lineEnding=if($Document.LineEnding-eq "CRLF"){"`r`n"}elseif($Document.LineEnding-eq "LF"){"`n"}else{""}
    $edits=New-Object System.Collections.ArrayList

    $managed=@(
        @{Name='ANTHROPIC_BASE_URL';Value=$Route.endpoint.baseUrl;Action='set'},
        @{Name='ANTHROPIC_MODEL';Value=$Route.model.value;Action='set'},
        @{Name='CLAUDE_CODE_AUTO_COMPACT_WINDOW';Value=([string]$Route.envPolicy.autoCompactWindow);Action=if(Has-Property $Route.envPolicy "autoCompactWindow"){'set'}else{'remove'}},
        @{Name='CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY';Value='1';Action=if($Route.envPolicy.gatewayDiscovery){'set'}else{'remove'}},
        @{Name='CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS';Value='1';Action=if($Route.envPolicy.disableExperimentalBetas){'set'}else{'remove'}},
        @{Name='CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC';Value='1';Action=if($Route.envPolicy.disableNonessentialTraffic){'set'}else{'remove'}},
        @{Name='ANTHROPIC_DEFAULT_OPUS_MODEL';Value=$Route.modelRoles.opus;Action=if(Has-Property $Route.modelRoles "opus"){'set'}else{'remove'}},
        @{Name='ANTHROPIC_DEFAULT_SONNET_MODEL';Value=$Route.modelRoles.sonnet;Action=if(Has-Property $Route.modelRoles "sonnet"){'set'}else{'remove'}},
        @{Name='ANTHROPIC_DEFAULT_HAIKU_MODEL';Value=$Route.modelRoles.haiku;Action=if(Has-Property $Route.modelRoles "haiku"){'set'}else{'remove'}},
        @{Name='ANTHROPIC_DEFAULT_FABLE_MODEL';Value=$Route.modelRoles.fable;Action=if(Has-Property $Route.modelRoles "fable"){'set'}else{'remove'}}
    )
    $authName=if($Auth.HasApi){'ANTHROPIC_API_KEY'}else{'ANTHROPIC_AUTH_TOKEN'}
    $oppositeAuth=if($Auth.HasApi){'ANTHROPIC_AUTH_TOKEN'}else{'ANTHROPIC_API_KEY'}
    $managed+=@{Name=$authName;Value=$Auth.Secret;Action='set'}
    $managed+=@{Name=$oppositeAuth;Value='';Action='remove'}

    $envMembers=$layout.EnvMembers

    if($layout.HasEnv){
        # Replace or remove existing env members.
        foreach($spec in $managed){
            $match=$null
            foreach($em in $envMembers){if($em.KeyName-ceq $spec.Name){$match=$em;break}}
            if($null-eq $match){continue}
            if($spec.Action-eq 'set'){
                $replacement=ConvertTo-JsonStringLiteral $spec.Value
                [void]$edits.Add([pscustomobject]@{Start=$match.ValueStart;Length=$match.ValueLength;Replacement=$replacement;ManagedName=$spec.Name})
            }else{
                # Removal: deterministic minimal member/comma span.
                $removeStart=$match.KeyStart
                $removeEnd=$match.ValueStart+$match.ValueLength
                if($match.HasCommaAfter){
                    # remove the member and following separator; also consume
                    # whitespace after the previous comma so no blank line remains
                    if($match.PrevCommaStart-ge 0){
                        $removeStart=$match.PrevCommaStart+1
                    }
                    $removeEnd=$match.CommaStart+1
                }else{
                    # last member: remove the preceding separator and member
                    $previous=$null
                    foreach($em in $envMembers){if($em.KeyStart-lt $match.KeyStart){$previous=$em}}
                    if($null-ne $previous-and $previous.CommaStart-ge 0){
                        $removeStart=$previous.CommaStart
                    }
                    # sole member: keep braces, remove member body only
                }
                [void]$edits.Add([pscustomobject]@{Start=$removeStart;Length=($removeEnd-$removeStart);Replacement='';ManagedName=$spec.Name})
            }
        }
        # Insert missing managed members immediately before the env closing brace.
        $missing=@()
        foreach($spec in $managed){
            $exists=$false
            foreach($em in $envMembers){if($em.KeyName-ceq $spec.Name){$exists=$true;break}}
            if(-not $exists-and $spec.Action-eq 'set'){$missing+=$spec}
        }
        if($missing.Count){
            $insertIndent=$layout.EnvIndent
            $insertParts=@()
            foreach($spec in $missing){$insertParts+=('"'+$spec.Name+'"'+':'+$(if($lineEnding){" "}else{""})+$(ConvertTo-JsonStringLiteral $spec.Value))}
            $memberSep=if($lineEnding){','+$lineEnding+$insertIndent}else{","}
            $insertText=($insertParts-join $memberSep)
            if($lineEnding){
                if($envMembers.Count){
                    # attach comma to the last existing member; trailing newline/indent stays
                    $lastMember=$envMembers[$envMembers.Count-1]
                    $insertText=','+$lineEnding+$insertIndent+$insertText
                    [void]$edits.Add([pscustomobject]@{Start=($lastMember.ValueStart+$lastMember.ValueLength);Length=0;Replacement=$insertText;ManagedName=($missing|ForEach-Object Name)-join ';'})
                }else{
                    # empty env object: fill inside braces with one inferred indent level
                    $insertText=$lineEnding+$insertIndent+$insertText+$lineEnding+$layout.RootIndent
                    [void]$edits.Add([pscustomobject]@{Start=$layout.Env.Close;Length=0;Replacement=$insertText;ManagedName=($missing|ForEach-Object Name)-join ';'})
                }
            }else{
                # compact JSON: leading comma only when members already exist
                if($envMembers.Count){$insertText=','+$insertText}
                [void]$edits.Add([pscustomobject]@{Start=$layout.Env.Close;Length=0;Replacement=$insertText;ManagedName=($missing|ForEach-Object Name)-join ';'})
            }
        }
    }else{
        # Insert a complete top-level env object using root member/comma rules.
        $rootMembers=$layout.RootMembers
        $rootIndent=$layout.RootIndent
        $envIndent=$rootIndent+'  '
        $envLines=@()
        foreach($spec in $managed){
            if($spec.Action-ne 'set'){continue}
            $envLines+=('"'+$spec.Name+'"'+':'+$(if($lineEnding){" "}else{""})+$(ConvertTo-JsonStringLiteral $spec.Value))
        }
        $memberSep=if($lineEnding){','+$lineEnding+$envIndent}else{","}
        $envBody=$envLines-join $memberSep
        if($lineEnding){
            $envObject='"env": {'+$lineEnding+$envIndent+$envBody+$lineEnding+$rootIndent+'}'
        }else{
            $envObject='"env": {'+$envBody+'}'
        }
        $insertText=$envObject
        if($rootMembers.Count){
            if($lineEnding){
                $lastRoot=$rootMembers[$rootMembers.Count-1]
                $insertText=','+$lineEnding+$rootIndent+$envObject
                [void]$edits.Add([pscustomobject]@{Start=($lastRoot.ValueStart+$lastRoot.ValueLength);Length=0;Replacement=$insertText;ManagedName='env'})
            }else{
                $insertText=','+$envObject
                [void]$edits.Add([pscustomobject]@{Start=$layout.RootClose;Length=0;Replacement=$insertText;ManagedName='env'})
            }
        }else{
            [void]$edits.Add([pscustomobject]@{Start=$layout.RootClose;Length=0;Replacement=$insertText;ManagedName='env'})
        }
    }
    # Coalesce overlapping or adjacent removal spans (adjacent member removals
    # share a comma boundary) into single deterministic spans.
    $coalesced=New-Object System.Collections.ArrayList
    foreach($edit in @($edits|Sort-Object Start)){
        $lastEdit=$null
        if($coalesced.Count){$lastEdit=$coalesced[$coalesced.Count-1]}
        if($lastEdit-and $lastEdit.Replacement.Length-eq 0-and $edit.Replacement.Length-eq 0-and $edit.Start-le ($lastEdit.Start+$lastEdit.Length)){
            $mergeStart=$lastEdit.Start
            $mergeEnd=[Math]::Max($lastEdit.Start+$lastEdit.Length,$edit.Start+$edit.Length)
            $coalesced[$coalesced.Count-1]=[pscustomobject]@{Start=$mergeStart;Length=($mergeEnd-$mergeStart);Replacement='';ManagedName=($lastEdit.ManagedName+';'+$edit.ManagedName)}
        }else{
            [void]$coalesced.Add($edit)
        }
    }
    return (Repair-DanglingRemovalCommas -Raw $raw -Edits $coalesced)
}

function Repair-DanglingRemovalCommas {
    param([string]$Raw,[array]$Edits)
    # A removal span that ends at the object's closing brace and starts right
    # after a comma leaves that comma dangling (e.g. removing the trailing run
    # of members). Extend such spans back over the comma so the JSON stays
    # valid and no blank-member line remains.
    $out=New-Object System.Collections.ArrayList
    foreach($edit in $Edits){
        if($edit.Replacement.Length-ne 0-or $edit.Length-le 0){[void]$out.Add($edit);continue}
        $s=$edit.Start; $e=$edit.Start+$edit.Length
        if($s-gt 0-and $Raw[$s-1]-eq ','){
            $j=$e; while($j-lt $Raw.Length-and [char]::IsWhiteSpace($Raw[$j])){$j++}
            if($j-lt $Raw.Length-and $Raw[$j]-eq '}'){$s=$s-1}
        }
        [void]$out.Add([pscustomobject]@{Start=$s;Length=($e-$s);Replacement='';ManagedName=$edit.ManagedName})
    }
    return $out
}

function New-SettingsRootValueEdits {
    param([object]$Document,[object]$Route)
    # Manages the two top-level settings keys availableModels (array of model
    # IDs derived from the route) and enforceAvailableModels (true). Set case:
    # write both when restrictModelPicker is on; remove case: drop both when
    # off. Missing members are inserted together as one edit so no two edits
    # share an insertion point.
    $raw=$Document.RawText
    $layout=Get-SettingsJsonLayout -Raw $raw
    $lineEnding=if($Document.LineEnding-eq "CRLF"){"`r`n"}elseif($Document.LineEnding-eq "LF"){"`n"}else{""}
    $rootIndent=$layout.RootIndent
    $edits=New-Object System.Collections.ArrayList

    $managedRoot=New-Object System.Collections.ArrayList
    if($Route.restrictModelPicker){
        [void]$managedRoot.Add(@{Name='availableModels';Literal=(ConvertTo-JsonValueLiteral (Get-RouteAllowList $Route));Action='set'})
        [void]$managedRoot.Add(@{Name='enforceAvailableModels';Literal='true';Action='set'})
    }else{
        [void]$managedRoot.Add(@{Name='availableModels';Literal='';Action='remove'})
        [void]$managedRoot.Add(@{Name='enforceAvailableModels';Literal='';Action='remove'})
    }

    $replace=New-Object System.Collections.ArrayList; $insert=New-Object System.Collections.ArrayList
    foreach($spec in $managedRoot){
        $match=$null
        foreach($rm in $layout.RootMembers){if($rm.KeyName-ceq $spec.Name){$match=$rm;break}}
        if($null-ne $match){
            if($spec.Action-eq 'set'){
                [void]$replace.Add(@{Match=$match;Literal=$spec.Literal;Name=$spec.Name})
            }else{
                $removeStart=$match.KeyStart
                $removeEnd=$match.ValueStart+$match.ValueLength
                if($match.HasCommaAfter){
                    if($match.PrevCommaStart-ge 0){$removeStart=$match.PrevCommaStart+1}
                    $removeEnd=$match.CommaStart+1
                }else{
                    $previous=$null
                    foreach($rm in $layout.RootMembers){if($rm.KeyStart-lt $match.KeyStart){$previous=$rm}}
                    if($null-ne $previous-and $previous.CommaStart-ge 0){$removeStart=$previous.CommaStart}
                }
                [void]$edits.Add([pscustomobject]@{Start=$removeStart;Length=($removeEnd-$removeStart);Replacement='';ManagedName=$spec.Name})
            }
        }elseif($spec.Action-eq 'set'){
            [void]$insert.Add($spec)
        }
    }
    foreach($m in $replace){
        [void]$edits.Add([pscustomobject]@{Start=$m.Match.ValueStart;Length=$m.Match.ValueLength;Replacement=$m.Literal;ManagedName=$m.Name})
    }
    if($insert.Count){
        $parts=@()
        foreach($spec in $insert){$parts+=('"'+$spec.Name+'"'+':'+$(if($lineEnding){" "}else{""})+$spec.Literal)}
        $memberSep=if($lineEnding){','+$lineEnding+$rootIndent}else{","}
        $insertMembers=($parts-join $memberSep)
        if($layout.RootMembers.Count){
            if($lineEnding){
                $lastRoot=$layout.RootMembers[$layout.RootMembers.Count-1]
                $insertText=','+$lineEnding+$rootIndent+$insertMembers
                [void]$edits.Add([pscustomobject]@{Start=($lastRoot.ValueStart+$lastRoot.ValueLength);Length=0;Replacement=$insertText;ManagedName=(($insert|ForEach-Object Name)-join ';')})
            }else{
                $insertText=','+$insertMembers
                [void]$edits.Add([pscustomobject]@{Start=$layout.RootClose;Length=0;Replacement=$insertText;ManagedName=(($insert|ForEach-Object Name)-join ';')})
            }
        }else{
            [void]$edits.Add([pscustomobject]@{Start=$layout.RootClose;Length=0;Replacement=$insertMembers;ManagedName=(($insert|ForEach-Object Name)-join ';')})
        }
    }
    return (Repair-DanglingRemovalCommas -Raw $raw -Edits $edits)
}

function Apply-SettingsTextEdits {
    param([string]$Raw,[array]$Edits)
    $len=$Raw.Length
    $seen=@{}
    foreach($edit in $Edits){
        if($edit.Start-lt 0-or $edit.Length-lt 0-or ($edit.Start+$edit.Length)-gt $len){Fail "edit out of bounds"}
        if($seen.ContainsKey($edit.ManagedName)){Fail "duplicate managed edit"}
        $seen[$edit.ManagedName]=$true
    }
    $ordered=@($Edits|Sort-Object Start -Descending)
    for($idx=0;$idx-lt $ordered.Count;$idx++){
        if($idx-gt 0-and ($ordered[$idx].Start+$ordered[$idx].Length)-gt $ordered[$idx-1].Start){Fail "overlapping edits"}
    }
    $builder=New-Object Text.StringBuilder
    $cursor=$len
    foreach($edit in $ordered){
        [void]$builder.Insert(0,$Raw.Substring($edit.Start+$edit.Length,$cursor-($edit.Start+$edit.Length)))
        [void]$builder.Insert(0,$edit.Replacement)
        $cursor=$edit.Start
    }
    [void]$builder.Insert(0,$Raw.Substring(0,$cursor))
    return $builder.ToString()
}

function Assert-SettingsTextPreserved {
    param([string]$Before,[string]$After,[array]$Edits)
    $expected=Apply-SettingsTextEdits -Raw $Before -Edits $Edits
    if($expected-cne $After){Fail "surgical text reconstruction mismatch"}
    # Walk both texts together: every segment between edits must match exactly.
    $ordered=@($Edits|Sort-Object Start)
    $beforeCursor=0
    $afterCursor=0
    foreach($edit in $ordered){
        $span=$edit.Start-$beforeCursor
        if($span-lt 0){Fail "edit order inconsistency"}
        if($After.Substring($afterCursor,$span)-cne $Before.Substring($beforeCursor,$span)){Fail "unchanged segment altered"}
        $afterCursor+=$span
        $afterCursor+=$edit.Replacement.Length
        $beforeCursor=$edit.Start+$edit.Length
    }
    if($beforeCursor-lt $Before.Length){
        $tail=$Before.Substring($beforeCursor)
        if($After.Substring($afterCursor)-cne $tail){Fail "trailing segment altered"}
    }
}

function Write-NewBytes {
    param([string]$Path,[byte[]]$Bytes)
    $stream=[IO.File]::Open($Path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try{$stream.Write($Bytes,0,$Bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
}

function ConvertFrom-SettingsText {
    param([string]$Text,[string]$Label)
    Assert-NoDuplicateKeys $Text
    try{$obj=$Text|ConvertFrom-Json}catch{Fail "$Label malformed JSON"}
    if(!($obj-is [Management.Automation.PSCustomObject])){Fail "$Label root must be object"}
    return $obj
}

function New-SettingsOutputBytes {
    param([object]$Document,[string]$Text)
    $body=[Text.UTF8Encoding]::new($false).GetBytes($Text)
    if($Document.HasUtf8Bom){
        $out=New-Object byte[] ($body.Length+3)
        $out[0]=0xEF;$out[1]=0xBB;$out[2]=0xBF
        [Array]::Copy($body,0,$out,3,$body.Length)
        return $out
    }
    return $body
}

function Invoke-ClaudeRoutingApply {
    param(
        [Parameter(Mandatory=$true)][string]$SettingsPath,
        [Parameter(Mandatory=$true)][string]$RoutingProfilePath,
        [Parameter(Mandatory=$true)][string]$SchemaPath,
        [string]$OutputLabel="",
        [switch]$JsonOutput,
        [ValidateSet("None","AfterBackup","AfterTempWrite","AfterReplace")][string]$TestFailureStage="None"
    )
    $ErrorActionPreference="Stop"
    $SettingsPath=Get-Canonical $SettingsPath
    $RoutingProfilePath=Get-Canonical $RoutingProfilePath
    $SchemaPath=Get-Canonical $SchemaPath
    $script:SettingsPath=$SettingsPath
    $script:RoutingProfilePath=$RoutingProfilePath
    $script:SchemaPath=$SchemaPath
    $stage="VALIDATION"
    $script:backupPath=$null
    $tempPath=$null
    $targetMayHaveChanged=$false

    try{
        $routeDoc=Read-Json $script:RoutingProfilePath "routing"; $schemaDoc=Read-Json $script:SchemaPath "schema"
        Assert-SchemaCompliance $routeDoc.Object $schemaDoc.Object
        $settingsDoc=Read-SettingsDocument $script:SettingsPath
        $auth=Validate-Inputs $routeDoc.Object $settingsDoc.ParsedObject
        $unsupported=Get-UnsupportedSnapshot $settingsDoc.ParsedObject
        $edits=New-SettingsEnvEdits -Document $settingsDoc -Route $routeDoc.Object -Auth $auth
        $rootEdits=New-SettingsRootValueEdits -Document $settingsDoc -Route $routeDoc.Object
        $allEdits=@($edits)+@($rootEdits)
        $newText=Apply-SettingsTextEdits -Raw $settingsDoc.RawText -Edits $allEdits
        Assert-SettingsTextPreserved -Before $settingsDoc.RawText -After $newText -Edits $allEdits
        $tempObject=ConvertFrom-SettingsText $newText "surgical output"
        Verify-Contract $tempObject $routeDoc.Object $auth $unsupported
        $preHash=Get-ClaudeSha256 -Path $script:SettingsPath
        $stage="TRANSACTION"; $dir=Split-Path $script:SettingsPath -Parent; $backupDir=Join-Path $dir "backup"; if(!(Test-Path -LiteralPath $backupDir -PathType Container)){New-Item -ItemType Directory -Path $backupDir -Force|Out-Null}; $script:backupPath=Join-Path $backupDir ("settings.backup."+[DateTime]::UtcNow.ToString("yyyyMMddHHmmssfff")+"."+[guid]::NewGuid().ToString("N")+".json"); [IO.File]::Copy($script:SettingsPath,$script:backupPath,$false)
        if($TestFailureStage-eq "AfterBackup"){Fail "synthetic failure after backup"}
        $tempPath=Join-Path $dir (".bdf-transaction-"+[guid]::NewGuid().ToString("N")+".tmp")
        $outputBytes=New-SettingsOutputBytes -Document $settingsDoc -Text $newText
        Write-NewBytes -Path $tempPath -Bytes $outputBytes
        $tempDoc=Read-SettingsDocument $tempPath
        Verify-Contract $tempDoc.ParsedObject $routeDoc.Object $auth $unsupported
        if($TestFailureStage-eq "AfterTempWrite"){Fail "synthetic failure after temp write"}
        $discard=$tempPath+".old"; $targetMayHaveChanged=$true; [IO.File]::Replace($tempPath,$SettingsPath,$discard); if(Test-Path $discard){Remove-Item $discard -Force}; $tempPath=$null
        if($TestFailureStage-eq "AfterReplace"){Fail "synthetic failure after replace"}
        if($TestFailureStage-in @("AfterRecoveryCopy","AfterRecoveryReplace")){Fail "synthetic failure to reach recovery"}
        $stage="POST-WRITE VERIFICATION"; $final=Read-SettingsDocument $script:SettingsPath
        Verify-Contract $final.ParsedObject $routeDoc.Object $auth $unsupported
        $backupSha256=Get-ClaudeSha256 -Path $script:backupPath
        $postHash=Get-ClaudeSha256 -Path $script:SettingsPath
        if($JsonOutput){
            $meta=[ordered]@{ok=$true;backupName=[IO.Path]::GetFileName($script:backupPath);backupSha256=$backupSha256;preWriteTargetSha256=$preHash;postWriteTargetSha256=$postHash;coreVersion=$script:CLAUDE_ROUTING_CORE_VERSION;schemaIdentity=(Get-ClaudeSha256 -Path $script:SchemaPath)}
            [Console]::Out.WriteLine(($meta|ConvertTo-Json -Compress))
            exit 0
        }
        Write-Output "SUCCESS POST-WRITE VERIFICATION $OutputLabel"
        exit 0
    }catch{
        $reason=$_.Exception.Message
        if($script:backupPath){
            try{if($targetMayHaveChanged){Restore-Backup}; if(!$targetMayHaveChanged){$original=[IO.File]::ReadAllBytes($script:backupPath);$current=[IO.File]::ReadAllBytes($script:SettingsPath);if((Convert-Semantic $original)-cne(Convert-Semantic $current)){Fail "unchanged target verification failed"}}; if($JsonOutput){[Console]::Error.WriteLine($stage+" FAILED; "+$reason+"; RECOVERY VERIFIED")}else{Write-Output "$stage FAILED; $reason; RECOVERY VERIFIED"}}
            catch{if($JsonOutput){[Console]::Error.WriteLine($stage+" FAILED; RECOVERY FAILED")}else{Write-Output "$stage FAILED; RECOVERY FAILED"}; exit 2}
        }else{if($JsonOutput){[Console]::Error.WriteLine("VALIDATION FAILED; "+$reason)}else{Write-Output "VALIDATION FAILED; $reason"}}
        exit 1
    }finally{if($tempPath-and (Test-Path -LiteralPath $tempPath)){Remove-Item -LiteralPath $tempPath -Force}}
}

function Invoke-ClaudeRoutingRestore {
    param(
        [Parameter(Mandatory=$true)][string]$SettingsPath,
        [Parameter(Mandatory=$true)][string]$BackupPath,
        [Parameter(Mandatory=$true)][string]$SchemaPath,
        [string]$ExpectedBackupSha256,
        [string]$TargetBindingSha256,
        [switch]$JsonOutput,
        [ValidateSet("None","AfterBackup","AfterTempWrite","AfterReplace","AfterRecoveryCopy","AfterRecoveryReplace")][string]$TestFailureStage="None"
    )
    $ErrorActionPreference="Stop"
    $script:SettingsPath=Get-Canonical $SettingsPath
    $backupPath=Get-Canonical $BackupPath
    $schemaPath=Get-Canonical $SchemaPath
    $stage="RESTORE VALIDATION"
    $dir=Split-Path $script:SettingsPath -Parent
    $recovery=Join-Path $dir (".bdf-transaction-recovery-"+[guid]::NewGuid().ToString("N")+".tmp")
    $recoveryDiscard=$recovery+".old"
    $targetMayHaveChanged=$false

    try{
        if(!(Test-Path -LiteralPath $backupPath -PathType Leaf)){Fail "backup missing"}
        if($ExpectedBackupSha256-and (Get-ClaudeSha256 -Path $backupPath)-ine $ExpectedBackupSha256){Fail "backup hash mismatch"}
        if($TargetBindingSha256){
            $bindingText=$script:SettingsPath.ToLowerInvariant().Replace('\','/').TrimEnd('/')
            $binding=[Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($bindingText))
            $bindingHex=([BitConverter]::ToString($binding)).Replace("-","").ToLowerInvariant()
            if($bindingHex-cne $TargetBindingSha256.ToLowerInvariant()){Fail "target binding mismatch"}
        }
        if(!(Test-Path -LiteralPath $schemaPath -PathType Leaf)){Fail "schema missing"}
        $schemaDoc=Read-Json $schemaPath "schema"
        $backupDoc=Read-Json $backupPath "backup"
        if($TestFailureStage-eq "AfterBackup"){Fail "synthetic failure after backup validation"}
        [IO.File]::Copy($script:SettingsPath,$recovery,$false)
        $targetMayHaveChanged=$true
        $stage="RESTORE REPLACE"
        if($TestFailureStage-eq "AfterTempWrite"){Fail "synthetic failure after recovery copy"}
        $staging=Join-Path $dir (".bdf-transaction-restore-staging-"+[guid]::NewGuid().ToString("N")+".tmp")
        [IO.File]::Copy($backupPath,$staging,$false)
        $discard=Join-Path $dir (".bdf-transaction-restore-discard-"+[guid]::NewGuid().ToString("N")+".tmp")
        [IO.File]::Replace($staging,$script:SettingsPath,$discard)
        if(Test-Path $staging){Remove-Item $staging -Force}
        if(Test-Path $discard){Remove-Item $discard -Force}
        if($TestFailureStage-eq "AfterReplace"){Fail "synthetic failure after replace"}
        if($TestFailureStage-in @("AfterRecoveryCopy","AfterRecoveryReplace")){Fail "synthetic failure to reach recovery"}
        $stage="RESTORE VERIFICATION"
        $final=Read-Json $script:SettingsPath "restored target"
        $a=[IO.File]::ReadAllBytes($backupPath);$b=[IO.File]::ReadAllBytes($script:SettingsPath);if((Convert-Semantic $a)-cne(Convert-Semantic $b)){Fail "restore bytes differ"}
        $restoredSha=Get-ClaudeSha256 -Path $script:SettingsPath
        if($JsonOutput){
            $meta=[ordered]@{ok=$true;restoredTargetSha256=$restoredSha;coreVersion=$script:CLAUDE_ROUTING_CORE_VERSION;schemaIdentity=(Get-ClaudeSha256 -Path $schemaPath)}
            [Console]::Out.WriteLine(($meta|ConvertTo-Json -Compress))
            exit 0
        }
        Write-Output "SUCCESS RESTORE VERIFICATION"
        exit 0
    }catch{
        $reason=$_.Exception.Message
        if($targetMayHaveChanged){
            $stage="RECOVERY RESTORE"
            try{
                if($TestFailureStage-eq "AfterRecoveryCopy"){Fail "synthetic failure after recovery copy"}
                [IO.File]::Replace($recovery,$script:SettingsPath,$recoveryDiscard)
                if($TestFailureStage-eq "AfterRecoveryReplace"){Fail "synthetic failure after recovery replace"}
                $verify=Read-Json $script:SettingsPath "recovered target"
                if($JsonOutput){[Console]::Error.WriteLine("RESTORE FAILED; RECOVERY VERIFIED")}else{Write-Output "RESTORE FAILED; RECOVERY VERIFIED"}
                exit 1
            }catch{
                if($JsonOutput){[Console]::Error.WriteLine("RESTORE FAILED; RECOVERY FAILED")}else{Write-Output "RESTORE FAILED; RECOVERY FAILED"}
                exit 2
            }
        }else{
            if($JsonOutput){[Console]::Error.WriteLine($stage+" FAILED; "+$reason)}else{Write-Output "$stage FAILED; $reason"}
            exit 1
        }
    }finally{
        if($recoveryDiscard-and (Test-Path -LiteralPath $recoveryDiscard)){Remove-Item -LiteralPath $recoveryDiscard -Force}
        if($recovery-and (Test-Path -LiteralPath $recovery)){Remove-Item -LiteralPath $recovery -Force}
    }
}

Export-ModuleMember -Function Invoke-ClaudeRoutingApply,Invoke-ClaudeRoutingRestore,Fail,Get-Canonical,Assert-NoReparseComponent,Read-Json,Assert-NoDuplicateKeys,Get-UnsupportedSnapshot,Get-RouteAllowList,ConvertTo-JsonValueLiteral,Verify-Contract,Write-Utf8File,Restore-Backup,Read-SettingsDocument,Get-SettingsJsonLayout,ConvertTo-JsonStringLiteral,New-SettingsEnvEdits,New-SettingsRootValueEdits,Apply-SettingsTextEdits,Assert-SettingsTextPreserved,Write-NewBytes,ConvertFrom-SettingsText -Variable CLAUDE_ROUTING_CORE_VERSION
