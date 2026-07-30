param(
  [string]$CsvPath = "$PSScriptRoot/../data/vlearn-pack/chatlog/chat_history_anonymized_for_hackathon.csv"
)

$rows = Import-Csv $CsvPath
$students = $rows | Where-Object role -eq 'student'
$tutors = $rows | Where-Object role -eq 'tutor'
$tutorByTurn = @{}
foreach ($row in $tutors) {
  $tutorByTurn[$row.turn_id] = $row
}

$selected = $students | Where-Object {
  $_.content -match '^\(Trang\s+\d+,'
}

$missing = 0
$samePage = 0
$otherPageOnly = 0

foreach ($row in $selected) {
  [void]($row.content -match '^\(Trang\s+(\d+),')
  $selectedPage = $Matches[1]
  $citations = $tutorByTurn[$row.turn_id].citations

  if ($citations -eq '[]') {
    $missing++
  } elseif ($citations -match "(?<!\d)$selectedPage(?!\d)") {
    $samePage++
  } else {
    $otherPageOnly++
  }
}

[pscustomobject]@{
  message_rows = $rows.Count
  student_turns = $students.Count
  tutor_turns = $tutors.Count
  turns_with_selected_page = $selected.Count
  selected_page_missing_citation = $missing
  selected_page_cites_same_page = $samePage
  selected_page_cites_other_page_only = $otherPageOnly
  tutor_asked_check_question = ($tutors | Where-Object asked_check_question -eq 'True').Count
  misconceptions_field_used = ($tutors | Where-Object misconceptions -ne '[]').Count
  follow_ups_field_used = ($tutors | Where-Object follow_ups -ne '[]').Count
} | Format-List
