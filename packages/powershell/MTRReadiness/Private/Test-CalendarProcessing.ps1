function Test-CalendarProcessing {
    <#
    .SYNOPSIS
        Validates Exchange Online calendar-processing settings for a room mailbox.
    .DESCRIPTION
        Checks that AutomateProcessing, DeleteComments, DeleteSubject,
        AddOrganizerToSubject, RemovePrivateProperty, and
        ProcessExternalMeetingMessages are configured correctly for Teams Rooms.
    .PARAMETER Identity
        The UPN or email address of the room mailbox.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Identity
    )

    try {
        $calProc = Get-CalendarProcessing -Identity $Identity -ErrorAction Stop
    }
    catch {
        return [PSCustomObject]@{
            CheckId    = 'cal-calendar-processing'
            CategoryId = 'calendar'
            Status     = 'fail'
            Details    = "Failed to retrieve calendar processing for '$Identity': $($_.Exception.Message)"
            RawData    = @{ error = $_.Exception.Message }
        }
    }

    # Evaluate all properties and collect issues/warnings
    $issues = @()
    $warnings = @()

    if ($calProc.AutomateProcessing -ne 'AutoAccept') {
        $issues += "AutomateProcessing is '$($calProc.AutomateProcessing)' (should be AutoAccept)"
    }
    if ($calProc.DeleteComments -eq $true) {
        $issues += 'DeleteComments is true (meeting body with Teams join link will be removed)'
    }
    if ($calProc.DeleteSubject -eq $true) {
        $issues += 'DeleteSubject is true (subject will be removed from device display)'
    }
    if ($calProc.AddOrganizerToSubject -eq $true) {
        $warnings += 'AddOrganizerToSubject is true (overwrites subject with organizer name)'
    }
    if ($calProc.RemovePrivateProperty -eq $true) {
        $warnings += 'RemovePrivateProperty is true (private flag stripped from meetings)'
    }

    $rawData = @{
        room = $Identity
        AutomateProcessing     = [string]$calProc.AutomateProcessing
        DeleteComments         = [bool]$calProc.DeleteComments
        DeleteSubject          = [bool]$calProc.DeleteSubject
        AddOrganizerToSubject  = [bool]$calProc.AddOrganizerToSubject
        RemovePrivateProperty  = [bool]$calProc.RemovePrivateProperty
    }

    if ($issues.Count -gt 0) {
        return [PSCustomObject]@{
            CheckId    = 'cal-calendar-processing'
            CategoryId = 'calendar'
            Status     = 'fail'
            Details    = "$Identity`: $($issues -join '; ')"
            RawData    = $rawData
        }
    }
    elseif ($warnings.Count -gt 0) {
        return [PSCustomObject]@{
            CheckId    = 'cal-calendar-processing'
            CategoryId = 'calendar'
            Status     = 'warning'
            Details    = "$Identity`: $($warnings -join '; ')"
            RawData    = $rawData
        }
    }
    else {
        return [PSCustomObject]@{
            CheckId    = 'cal-calendar-processing'
            CategoryId = 'calendar'
            Status     = 'pass'
            Details    = "Calendar processing for '$Identity' is correctly configured."
            RawData    = $rawData
        }
    }
}

function Test-ExternalMeetingProcessing {
    <#
    .SYNOPSIS
        Checks if external meeting messages are processed for a room mailbox.
    .PARAMETER Identity
        The UPN or email address of the room mailbox.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Identity
    )

    try {
        $calProc = Get-CalendarProcessing -Identity $Identity -ErrorAction Stop
    }
    catch {
        return [PSCustomObject]@{
            CheckId    = 'cal-external-meeting-processing'
            CategoryId = 'calendar'
            Status     = 'fail'
            Details    = "Failed to retrieve calendar processing for '$Identity': $($_.Exception.Message)"
            RawData    = @{ error = $_.Exception.Message }
        }
    }

    if ($calProc.ProcessExternalMeetingMessages -eq $true) {
        return [PSCustomObject]@{
            CheckId    = 'cal-external-meeting-processing'
            CategoryId = 'calendar'
            Status     = 'pass'
            Details    = "ProcessExternalMeetingMessages is enabled - external meeting invitations are auto-processed."
            RawData    = @{ ProcessExternalMeetingMessages = $true }
        }
    }
    else {
        return [PSCustomObject]@{
            CheckId    = 'cal-external-meeting-processing'
            CategoryId = 'calendar'
            Status     = 'fail'
            Details    = "ProcessExternalMeetingMessages is disabled - external meeting invitations will be ignored."
            RawData    = @{ ProcessExternalMeetingMessages = $false }
        }
    }
}
