$preview = Get-Content "C:\Proyectos\AGENTIA-CHATBOT\public\anuario-k3\paginas-preview.txt"
$kids = @(
  @{ slug = "amaia"; re = "Amaia|Garrido" },
  @{ slug = "cami"; re = "Camila|Cami|Juliet|Jasso" },
  @{ slug = "sara"; re = "Sara(?!rita)" },
  @{ slug = "fernanda"; re = "Fernanda" },
  @{ slug = "ana-pau"; re = "Ana\s*Pau|Anapau" },
  @{ slug = "naty"; re = "Natalia|Naty|Chiwy|Chiwi" },
  @{ slug = "elias"; re = "El[ií]as" },
  @{ slug = "fabio"; re = "Fabio" },
  @{ slug = "matthias"; re = "Matth[ií]as|Matias|Mathias" },
  @{ slug = "gabito"; re = "Gabriel|Gabito" },
  @{ slug = "lia"; re = "\bLia\b|\bL[ií]a\b" },
  @{ slug = "kesleigh"; re = "Kesleig|Kesling|Kesleigh" },
  @{ slug = "romina"; re = "Romina" },
  @{ slug = "naty"; re = "Natalia" }
)

function Detect-Kind($text) {
  if ($text -match "QUERIDO AVENTURERO") { return "carta" }
  if ($text -match "GUARDIANAS|Miss Vale|Miss Paty") { return "maestras" }
  if ($text -match "MENSAJE DEL COMANDO|COMANDO ESTELAR") { return "comando" }
  if ($text -match "RECUERDOS DE NUESTRA") { return "recuerdos" }
  if ($text -match "Bitacora|Bitácora|sueña de gra|sueña") { return "bitacora" }
  if ($text -match "MISIÓN COMPLETADA|MISION COMPLETADA") { return "mision" }
  if ($text -match "Hasta siempre") { return "cierre" }
  if ($text -match "MISIÓN CUMPLIDA|PEQUENOSHOY|pequeños hoy") { return "cierre" }
  if ($text -match "primera gran misi") { return "mision" }
  if ($text.Trim().Length -lt 5) { return "portada" }
  return "otra"
}

function Detect-Slug($text, $kind) {
  # Prefer explicit names on bitacora/comando
  foreach ($k in @(
    @{ slug="amaia"; re="Amaia\s*Garrido|Amaia," },
    @{ slug="cami"; re="Camila\s*Juliet|Camila" },
    @{ slug="sara"; re="^Sara\b|Sara\s+Bitacora|Sara\s+Bitácora" },
    @{ slug="fernanda"; re="Fernanda" },
    @{ slug="ana-pau"; re="Ana\s*Pau" },
    @{ slug="naty"; re="Natalia|Chiwy|Chiwi" },
    @{ slug="elias"; re="El[ií]as" },
    @{ slug="fabio"; re="Fabio" },
    @{ slug="matthias"; re="Matth[ií]as|Matias" },
    @{ slug="gabito"; re="Gabriel|Gabito" },
    @{ slug="lia"; re="\bLia\b" },
    @{ slug="kesleigh"; re="Kesleig|Kesleigh|Kesling" },
    @{ slug="romina"; re="Romina" }
  )) {
    if ($text -match $k.re) { return $k.slug }
  }
  return $null
}

# Manual overrides from preview inspection (page -> slug for personal pages)
$manualSlug = @{
  3 = "amaia"; 4 = "amaia"; 5 = "amaia"
  6 = "cami"; 7 = "cami"; 8 = "cami"
  9 = "sara"; 10 = "sara"; 11 = "sara"; 12 = "sara"
  13 = "ana-pau"; 14 = "ana-pau"; 15 = "ana-pau"; 16 = "ana-pau"
  17 = "naty"; 18 = "naty"; 19 = "naty"
  20 = "elias"; 21 = "elias"; 22 = "elias"; 23 = "elias"
  24 = "fabio"; 25 = "fabio"; 26 = "fabio"; 27 = "fabio"
  28 = "matthias"; 29 = "matthias"; 30 = "matthias"; 31 = "matthias"
  32 = "gabito"; 33 = "gabito"; 34 = "gabito"
  35 = "kesleigh"; 36 = "kesleigh"; 37 = "kesleigh"
  # 38-49 appear as Amaia template repeats in export — still tag amaia
  38 = "amaia"; 39 = "amaia"; 40 = "amaia"
  41 = "amaia"; 42 = "amaia"; 43 = "amaia"
  44 = "amaia"; 45 = "amaia"; 46 = "amaia"
  47 = "amaia"; 48 = "amaia"; 49 = "amaia"
}

$titles = @{
  portada = "Portada"
  carta = "Querido Aventurero"
  bitacora = "Bitácora"
  recuerdos = "Recuerdos de nuestra misión"
  comando = "Mensaje del Comando Estelar"
  maestras = "Nuestras Guardianas"
  mision = "Misión completada"
  grupal = "Recuerdos del salón"
  cierre = "Cierre"
  otra = "Lámina"
}

$laminas = @()
for ($i = 1; $i -le 55; $i++) {
  $line = $preview | Where-Object { $_ -like "P$i|*" } | Select-Object -First 1
  $text = if ($line) { ($line -split "\|", 2)[1] } else { "" }
  $kind = Detect-Kind $text
  if ($i -eq 1) { $kind = "portada" }
  if ($i -eq 51) { $kind = "mision" }
  if ($i -eq 52) { $kind = "grupal" }
  if ($i -eq 53) { $kind = "mision" }
  if ($i -eq 54) { $kind = "cierre" }
  if ($i -eq 55) { $kind = "cierre" }
  if ($i -eq 50) { $kind = "maestras" }

  $slug = $null
  if ($manualSlug.ContainsKey($i)) { $slug = $manualSlug[$i] }
  elseif ($kind -in @("bitacora","recuerdos","comando")) { $slug = Detect-Slug $text $kind }

  $title = $titles[$kind]
  if ($slug) { $title = "$title · $slug" }

  $src = "/anuario-k3/paginas/pagina-{0:D2}.jpg" -f $i
  $obj = [ordered]@{ page = $i; src = $src; kind = $kind; title = $title }
  if ($slug) { $obj.slug = $slug }
  $laminas += [pscustomobject]$obj
}

$json = @{ version = 1; totalPages = 55; laminas = $laminas } | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText("C:\Proyectos\AGENTIA-CHATBOT\public\anuario-k3\manifest.json", $json, [Text.UTF8Encoding]::new($false))
Write-Output "manifest written $($laminas.Count)"
