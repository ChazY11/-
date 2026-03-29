# CloudBase MVP scaffold

This directory is the CloudBase / WeChat cloud development landing zone for the
miniapp live-room system.

## Target collections

- `live_rooms`
  - room snapshot
  - members
  - seats
  - room status
  - identity deliveries
  - public logs

- `live_room_actions`
  - night submissions
  - storyteller adjudications
  - daytime nominations / votes / executions

## First-round functions

- `rooms`
  - create room
  - join room
  - assign seats
  - lock room

- `identity`
  - send identity packet
  - query private identity packet

## Runtime strategy

The miniapp currently uses a local mock adapter by default so the MVP UI and
data flow can run without a bound cloud environment. Once a CloudBase env ID is
configured, the adapter layer can be switched to real cloud calls without
changing the page/store contracts.
