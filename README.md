# SubQuery Project to get Juno Validators and Delegators

This is a starter project for Indexing Juno,
It provides a list of all Juno validators and delegators, all delegations, and the total delegated for each entity.

It does not yet handle:

- cooldowns of delegation, it treats begin redelegate as a instantenous action
- the MsgCancelUnboundingDelegation

The numbers are probably not quite exactly accurate, but it's a great example of how to build a SubQuery project

# Getting Started

### 1. Install dependencies

```shell
yarn
```

### 2. Generate types

```shell
yarn codegen
```

### 3. Build

```shell
yarn build
```

### 4. Run locally

```shell
yarn start:docker
```
