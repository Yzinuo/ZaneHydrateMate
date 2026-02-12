# Local Data Persistence Specification

## Purpose
Define requirements for storing hydration domain data in a device-local SQLite database for offline-first Android app behavior.

## Requirements

### Requirement: Local SQLite Persistence
The system SHALL persist hydration domain data in a device-local SQLite database when running in the Capacitor Android app.

#### Scenario: Database initialization on startup
- **WHEN** the user opens the app
- **THEN** the app SHALL initialize and validate the local SQLite schema before domain reads/writes
- **AND** it SHALL use the local database as the primary data source

### Requirement: Offline Domain Read/Write
The system SHALL support profile, settings, intake creation, intake listing, and intake deletion without network connectivity.

#### Scenario: Add and read intake offline
- **WHEN** the device has no network and the user records water intake
- **THEN** the app SHALL persist the intake locally and return success to the UI
- **AND** subsequent list/stat requests SHALL read from local persisted records

### Requirement: Legacy Local Cache Migration
The system SHALL migrate existing local hydration data from prior local cache format into SQLite exactly once.

#### Scenario: First launch after migration build
- **WHEN** the app starts after upgrading from a legacy local cache version
- **THEN** it SHALL import legacy profile/settings/intake data into SQLite
- **AND** it SHALL mark migration as completed to avoid duplicate imports
