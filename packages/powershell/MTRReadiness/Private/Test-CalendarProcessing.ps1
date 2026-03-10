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

    $results = @()

    try {
        $calProc = Get-CalendarProcessing -Identity $Identity -ErrorAction Stop
    }
    catch {
        $results += [PSCustomObject]@{
            CheckId    = 'calendar-processing'
            CategoryId = 'calendar'
            Status     = 'fail'
            Details    = "Failed to retrieve calendar processing for '$Identity': $($_.Exception.Message)"
            RawData    = @{ error = $_.Exception.Message }
        }
        return $results
    }

    # --- AutomateProcessing should be AutoAccept ---
    if ($calProc.AutomateProcessing -eq 'AutoAccept') {
        $results += [PSCustomObject]@{
            CheckId    = 'calendar-processing'
            CategoryId = 'calendar'
            Status     = 'pass'
            Details    = "AutomateProcessing is set to AutoAccept."
            RawData    = @{ AutomateProcessing = $calProc.AutomateProcessing }
        }
    }
    else {
        $results += [PSCustomObject]@{
            CheckId    = 'calendar-processing'
            CategoryId = 'calendar'
            Status     = 'fail'
            Details    = "AutomateProcessing is '$($calProc.AutomateProcessing)' — expected 'AutoAccept'."
            RawData    = @{ AutomateProcessing = $calProc.AutomateProcessing }
        }
    }

    # --- DeleteComments should be $false ---
    if ($calProc.DeleteComments -eq $false) {
        $details = "DeleteComments is disabled (meeting body preserved for Teams join info)."
        $status = 'pass'
    }
    else {
        $details = "DeleteComments is enabled — Teams join info will be stripped from meeting bodies."
        $status = 'fail'
    }
    $results += [PSCustomObject]@{
        CheckId    = 'calendar-processing-delete-comments'
        CategoryId = 'calendar'
        Status     = $status
        Details    = $details
        RawData    = @{ DeleteComments = $calProc.DeleteComments }
    }

    # --- DeleteSubject should be $false ---
    if ($calProc.DeleteSubject -eq $false) {
        $details = "DeleteSubject is disabled (meeting subject visible on console)."
        $status = 'pass'
    }
    else {
        $details = "DeleteSubject is enabled — meeting subjects will not display on the console."
        $status = 'fail'
    }
    $results += [PSCustomObject]@{
        CheckId    = 'calendar-processing-delete-subject'
        CategoryId = 'calendar'
        Status     = $status
        Details    = $details
        RawData    = @{ DeleteSubject = $calProc.DeleteSubject }
    }

    # --- AddOrganizerToSubject should be $false ---
    if ($calProc.AddOrganizerToSubject -eq $false) {
        $details = "AddOrganizerToSubject is disabled (subject not overwritten with organizer name)."
        $status = 'pass'
    }
    else {
        $details = "AddOrganizerToSubject is enabled — the meeting subject will be replaced with the organizer's name."
        $status = 'warning'
    }
    $results += [PSCustomObject]@{
        CheckId    = 'calendar-processing-add-organizer'
        CategoryId = 'calendar'
        Status     = $status
        Details    = $details
        RawData    = @{ AddOrganizerToSubject = $calProc.AddOrganizerToSubject }
    }

    # --- RemovePrivateProperty should be $false ---
    if ($calProc.RemovePrivateProperty -eq $false) {
        $details = "RemovePrivateProperty is disabled (private flag preserved)."
        $status = 'pass'
    }
    else {
        $details = "RemovePrivateProperty is enabled — private meetings will not be marked as such."
        $status = 'warning'
    }
    $results += [PSCustomObject]@{
        CheckId    = 'calendar-processing-private-property'
        CategoryId = 'calendar'
        Status     = $status
        Details    = $details
        RawData    = @{ RemovePrivateProperty = $calProc.RemovePrivateProperty }
    }

    return $results
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
            CheckId    = 'external-meeting-processing'
            CategoryId = 'calendar'
            Status     = 'fail'
            Details    = "Failed to retrieve calendar processing for '$Identity': $($_.Exception.Message)"
            RawData    = @{ error = $_.Exception.Message }
        }
    }

    if ($calProc.ProcessExternalMeetingMessages -eq $true) {
        return [PSCustomObject]@{
            CheckId    = 'external-meeting-processing'
            CategoryId = 'calendar'
            Status     = 'pass'
            Details    = "ProcessExternalMeetingMessages is enabled — external meeting invitations are auto-processed."
            RawData    = @{ ProcessExternalMeetingMessages = $true }
        }
    }
    else {
        return [PSCustomObject]@{
            CheckId    = 'external-meeting-processing'
            CategoryId = 'calendar'
            Status     = 'fail'
            Details    = "ProcessExternalMeetingMessages is disabled — external meeting invitations will be ignored."
            RawData    = @{ ProcessExternalMeetingMessages = $false }
        }
    }
}
