$raw = [IO.File]::ReadAllText("C:\Proyectos\AGENTIA-CHATBOT\public\anuario-k3\anuario-texto.txt")
$pages = $raw -split [char]12
$out = New-Object System.Collections.Generic.List[string]
$out.Add("total=$($pages.Count)")
for ($i = 0; $i -lt $pages.Count; $i++) {
  $p = $pages[$i]
  $one = ($p -replace '\s+', ' ').Trim()
  if ($one.Length -gt 160) { $one = $one.Substring(0, 160) }
  $out.Add(("P{0}|{1}" -f ($i + 1), $one))
}
[IO.File]::WriteAllLines("C:\Proyectos\AGENTIA-CHATBOT\public\anuario-k3\paginas-preview.txt", $out)
Write-Output "ok $($pages.Count)"
