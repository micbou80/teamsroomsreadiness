function ConvertTo-UploadJson {
    <#
    .SYNOPSIS
        Converts check results into the JSON schema expected by the web upload API.
    .PARAMETER CheckResults
        Array of check result objects (PSCustomObject with CheckId, CategoryId, Status, Details, RawData).
    .PARAMETER Hostname
        The hostname where checks were executed.
    .OUTPUTS
        A hashtable matching the web app's uploadSchema (version, generatedAt, hostname, checks).
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [object[]]$CheckResults,

        [Parameter(Mandatory)]
        [string]$Hostname
    )

    $moduleVersion = (Get-Module -Name MTRReadiness -ErrorAction SilentlyContinue).Version
    if (-not $moduleVersion) {
        $moduleVersion = '0.1.0'
    }

    $checks = @()
    foreach ($r in $CheckResults) {
        $check = @{
            checkId    = $r.CheckId
            categoryId = $r.CategoryId
            status     = $r.Status
            details    = $r.Details
        }
        if ($r.RawData) {
            $check.rawData = $r.RawData
        }
        $checks += $check
    }

    return @{
        version     = $moduleVersion.ToString()
        generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        hostname    = $Hostname
        checks      = $checks
    }
}
