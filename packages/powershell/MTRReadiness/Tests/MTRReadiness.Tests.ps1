#Requires -Modules @{ ModuleName = 'Pester'; ModuleVersion = '5.0' }

<#
.SYNOPSIS
    Pester v5 tests for the MTRReadiness module.
.DESCRIPTION
    Tests calendar-processing checks with mocked Exchange Online cmdlets
    and network checks with mocked .NET classes.
#>

BeforeAll {
    $modulePath = Join-Path $PSScriptRoot '..' 'MTRReadiness.psd1'
    Import-Module $modulePath -Force
}

Describe 'Module Import' {
    It 'should import the MTRReadiness module' {
        $module = Get-Module -Name MTRReadiness
        $module | Should -Not -BeNullOrEmpty
        $module.Name | Should -Be 'MTRReadiness'
    }

    It 'should export expected public functions' {
        $commands = Get-Command -Module MTRReadiness
        $commands.Name | Should -Contain 'Invoke-MTRReadinessCheck'
        $commands.Name | Should -Contain 'Export-MTRReadinessReport'
        $commands.Name | Should -Contain 'Test-MTRNetworkReadiness'
    }
}

Describe 'Test-CalendarProcessing' {
    BeforeAll {
        # Mock Get-CalendarProcessing to return a well-configured room
        function Get-CalendarProcessing { param($Identity) }

        Mock Get-CalendarProcessing {
            [PSCustomObject]@{
                AutomateProcessing              = 'AutoAccept'
                DeleteComments                  = $false
                DeleteSubject                   = $false
                AddOrganizerToSubject           = $false
                RemovePrivateProperty           = $false
                ProcessExternalMeetingMessages  = $true
            }
        }
    }

    It 'should return pass for a correctly configured room' {
        $results = InModuleScope MTRReadiness { Test-CalendarProcessing -Identity 'mtr-room1@contoso.com' }
        $results | Should -Not -BeNullOrEmpty
        $results | ForEach-Object {
            $_.Status | Should -Be 'pass'
            $_.CategoryId | Should -Be 'calendar'
        }
    }

    It 'should return fail when AutomateProcessing is not AutoAccept' {
        Mock Get-CalendarProcessing {
            [PSCustomObject]@{
                AutomateProcessing              = 'AutoUpdate'
                DeleteComments                  = $false
                DeleteSubject                   = $false
                AddOrganizerToSubject           = $false
                RemovePrivateProperty           = $false
                ProcessExternalMeetingMessages  = $true
            }
        }

        $results = InModuleScope MTRReadiness { Test-CalendarProcessing -Identity 'mtr-room1@contoso.com' }
        $failedCheck = $results | Where-Object { $_.CheckId -eq 'calendar-processing' }
        $failedCheck.Status | Should -Be 'fail'
    }

    It 'should return fail when DeleteComments is true' {
        Mock Get-CalendarProcessing {
            [PSCustomObject]@{
                AutomateProcessing              = 'AutoAccept'
                DeleteComments                  = $true
                DeleteSubject                   = $false
                AddOrganizerToSubject           = $false
                RemovePrivateProperty           = $false
                ProcessExternalMeetingMessages  = $true
            }
        }

        $results = InModuleScope MTRReadiness { Test-CalendarProcessing -Identity 'mtr-room1@contoso.com' }
        $failedCheck = $results | Where-Object { $_.CheckId -eq 'calendar-processing-delete-comments' }
        $failedCheck.Status | Should -Be 'fail'
    }

    It 'should return fail when DeleteSubject is true' {
        Mock Get-CalendarProcessing {
            [PSCustomObject]@{
                AutomateProcessing              = 'AutoAccept'
                DeleteComments                  = $false
                DeleteSubject                   = $true
                AddOrganizerToSubject           = $false
                RemovePrivateProperty           = $false
                ProcessExternalMeetingMessages  = $true
            }
        }

        $results = InModuleScope MTRReadiness { Test-CalendarProcessing -Identity 'mtr-room1@contoso.com' }
        $failedCheck = $results | Where-Object { $_.CheckId -eq 'calendar-processing-delete-subject' }
        $failedCheck.Status | Should -Be 'fail'
    }
}

Describe 'Test-ExternalMeetingProcessing' {
    BeforeAll {
        function Get-CalendarProcessing { param($Identity) }
    }

    It 'should return pass when ProcessExternalMeetingMessages is true' {
        Mock Get-CalendarProcessing {
            [PSCustomObject]@{ ProcessExternalMeetingMessages = $true }
        }

        $result = InModuleScope MTRReadiness { Test-ExternalMeetingProcessing -Identity 'mtr-room1@contoso.com' }
        $result.Status | Should -Be 'pass'
        $result.CheckId | Should -Be 'external-meeting-processing'
    }

    It 'should return fail when ProcessExternalMeetingMessages is false' {
        Mock Get-CalendarProcessing {
            [PSCustomObject]@{ ProcessExternalMeetingMessages = $false }
        }

        $result = InModuleScope MTRReadiness { Test-ExternalMeetingProcessing -Identity 'mtr-room1@contoso.com' }
        $result.Status | Should -Be 'fail'
    }
}

Describe 'ConvertTo-UploadJson' {
    It 'should produce a valid upload payload' {
        $checkResults = @(
            [PSCustomObject]@{
                CheckId    = 'tcp-443-reachable'
                CategoryId = 'network'
                Status     = 'pass'
                Details    = 'All endpoints reachable.'
                RawData    = @{ passed = @('teams.microsoft.com') }
            }
        )

        $json = InModuleScope MTRReadiness {
            param($cr) ConvertTo-UploadJson -CheckResults $cr -Hostname 'TEST-PC'
        } -Parameters @{ cr = $checkResults }

        $json.version | Should -Not -BeNullOrEmpty
        $json.generatedAt | Should -Not -BeNullOrEmpty
        $json.hostname | Should -Be 'TEST-PC'
        $json.checks | Should -HaveCount 1
        $json.checks[0].checkId | Should -Be 'tcp-443-reachable'
        $json.checks[0].status | Should -Be 'pass'
    }
}

Describe 'Invoke-MTRReadinessCheck' {
    It 'should run network-only checks when -SkipCalendar is specified' {
        # This runs actual network checks — may take a few seconds
        $results = Invoke-MTRReadinessCheck -SkipCalendar -PassThru
        $results | Should -Not -BeNullOrEmpty
        $results.Count | Should -BeGreaterOrEqual 1
        $results | ForEach-Object {
            $_.CategoryId | Should -Be 'network'
            $_.CheckId | Should -Not -BeNullOrEmpty
            $_.Status | Should -BeIn @('pass', 'fail', 'warning', 'info')
        }
    }
}
