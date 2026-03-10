@{
    RootModule        = 'MTRReadiness.psm1'
    ModuleVersion     = '0.1.0'
    GUID              = 'a3f7b2c1-4d5e-6f78-9a0b-1c2d3e4f5a6b'
    Author            = 'Teams Rooms Readiness Contributors'
    CompanyName       = 'Open Source'
    Copyright         = '(c) 2026 Teams Rooms Readiness Contributors. MIT License.'
    Description       = 'Companion module for Teams Rooms Readiness Assessment. Runs Exchange Online calendar processing and network connectivity checks that require local execution, then exports JSON for upload to the web dashboard.'
    PowerShellVersion = '5.1'

    RequiredModules   = @(
        @{ ModuleName = 'ExchangeOnlineManagement'; ModuleVersion = '3.0.0' }
    )

    FunctionsToExport = @(
        'Invoke-MTRReadinessCheck'
        'Export-MTRReadinessReport'
        'Test-MTRNetworkReadiness'
    )

    CmdletsToExport   = @()
    VariablesToExport  = @()
    AliasesToExport    = @()

    PrivateData = @{
        PSData = @{
            Tags         = @('Teams', 'TeamsRooms', 'MTR', 'Microsoft365', 'Readiness', 'Assessment')
            LicenseUri   = 'https://github.com/micbou80/teamsroomsreadiness/blob/main/LICENSE'
            ProjectUri   = 'https://github.com/micbou80/teamsroomsreadiness'
            ReleaseNotes = 'Initial release — calendar processing + network checks.'
        }
    }
}
