$ErrorActionPreference = 'SilentlyContinue'

$localAppDataPath = 'C:\Users\lckj\AppData\Local'
$beforeFreeBytes = (Get-PSDrive -Name C).Free
$deletedBytes = [int64]0
$skippedTargets = [System.Collections.Generic.List[string]]::new()

function Get-FolderSizeBytes {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return [int64]0
    }

    $sum = (Get-ChildItem -LiteralPath $Path -Force -File -Recurse |
        Measure-Object -Property Length -Sum).Sum
    if ($null -eq $sum) {
        return [int64]0
    }
    return [int64]$sum
}

function Remove-RebuildableFolder {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    $sizeBefore = Get-FolderSizeBytes -Path $Path
    Remove-Item -LiteralPath $Path -Recurse -Force
    $sizeAfter = Get-FolderSizeBytes -Path $Path
    $script:deletedBytes += ($sizeBefore - $sizeAfter)

    if (Test-Path -LiteralPath $Path) {
        $skippedTargets.Add($Path)
    }
}

# Package manager caches can be downloaded again.
Remove-RebuildableFolder -Path (Join-Path $localAppDataPath 'npm-cache')
Remove-RebuildableFolder -Path (Join-Path $localAppDataPath 'pnpm-cache')

# Temporary files in use are skipped.
$temporaryPath = Join-Path $localAppDataPath 'Temp'
if (Test-Path -LiteralPath $temporaryPath) {
    Get-ChildItem -LiteralPath $temporaryPath -Force |
        ForEach-Object { Remove-RebuildableFolder -Path $_.FullName }
}

# Remove the old Postman install when Postman is not running.
$postmanRunning = Get-Process -Name 'Postman' -ErrorAction SilentlyContinue
if ($null -eq $postmanRunning) {
    Remove-RebuildableFolder -Path (Join-Path $localAppDataPath 'Postman\app-11.23.3')
} else {
    $skippedTargets.Add((Join-Path $localAppDataPath 'Postman\app-11.23.3'))
}

# JetBrains indexes, caches, logs, and embedded browser cache are rebuildable.
$jetBrainsProcess = Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessName -match '^(idea64|idea|pycharm|webstorm|rider|clion|datagrip|goland|phpstorm|rubymine|studio64)$' }
if ($null -eq $jetBrainsProcess) {
    $jetBrainsPath = Join-Path $localAppDataPath 'JetBrains\IntelliJIdea2024.1'
    @('index', 'caches', 'log', 'jcef_cache') | ForEach-Object {
        Remove-RebuildableFolder -Path (Join-Path $jetBrainsPath $_)
    }
} else {
    $skippedTargets.Add((Join-Path $localAppDataPath 'JetBrains\IntelliJIdea2024.1\index'))
    $skippedTargets.Add((Join-Path $localAppDataPath 'JetBrains\IntelliJIdea2024.1\caches'))
    $skippedTargets.Add((Join-Path $localAppDataPath 'JetBrains\IntelliJIdea2024.1\log'))
    $skippedTargets.Add((Join-Path $localAppDataPath 'JetBrains\IntelliJIdea2024.1\jcef_cache'))
}

$afterFreeBytes = (Get-PSDrive -Name C).Free
$observedFreedBytes = $afterFreeBytes - $beforeFreeBytes

Write-Host ''
Write-Host ('{0:N2} GB ({1:N0} MB)' -f ($observedFreedBytes / 1GB), ($observedFreedBytes / 1MB))
Write-Host ('{0:N2} GB' -f ($deletedBytes / 1GB))
Write-Host ('{0:N2} GB' -f ($afterFreeBytes / 1GB))

if ($skippedTargets.Count -gt 0) {
    Write-Host ''
    $skippedTargets | Sort-Object -Unique | ForEach-Object { Write-Host $_ }
}

Write-Host ''
