# Changelog

All notable changes to gsm.simaerep.viz will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-12-04

### Added
- SimaerepChart: Time series visualization for simaerep clinical trial monitoring
  - Cumulative deviation trends across sites over time
  - Study reference line, flagged sites, and unflagged sites
  - Right panel with individual site plots showing patient trajectories
  - Site and country selector dropdowns
  - Cross-widget site selection integration with gsm.kri
  - Metrics labels (Score, Delta, N) displayed inside each subplot
- Integration documentation for SimaerepChart htmlwidget

### Changed
- Updated documentation with SimaerepChart API reference

## [0.1.0] - Initial Release

### Added
- SiteList: Interactive site list chart with selection support
- Integration with gsm.kri global site selector
- Basic CI/CD pipeline with GitHub Actions

