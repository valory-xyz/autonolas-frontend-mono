---
name: enable-contract
description: Enable a new staking contract in the Operate app. Use when the user wants to add or enable a contract on the Operate contracts page for pearl, quickstart, or contribute platforms.
disable-model-invocation: true
---

# Enable Staking Contract in Operate App

Add a new staking contract to the Operate app so it appears on the contracts page.

## Step 1: Gather information

Use the **AskUserQuestion** tool to collect the following (ask all in a single call):

1. **Contract address** — the full 0x address. Either standard (`0x99Fe6B5C9980Fc3A44b1Dc32A76Db6aDfcf4c75e`) or zero-padded (`0x00000000000000000000000099fe6b5c9980fc3a44b1dc32a76db6adfcf4c75e`) — both are accepted.
2. **Contract name** — the label for the code comment, e.g. "Quickstart Beta Mech MarketPlace - Expert 13".
3. **Available on** — which platforms the contract should be listed on. Allow **multi-select** from the existing platforms: `pearl`, `quickstart`, `contribute`. Include a fourth option **"Add new platform"** for cases where a brand-new platform identifier is needed.

**UX note for AskUserQuestion:** For free-text fields (address, name), provide a single example option that shows the expected format (e.g. `label: "e.g. 0x99Fe6B5..."`) and ask the user to type their actual value via the auto-provided "Other" input. Do not create multiple artificial options for free-text fields.

## Step 2: Handle new platform (if selected)

If the user chose **"Add new platform"**, ask a follow-up with these questions:

1. **Platform key** — lowercase identifier used in code (e.g. `pearl`, `quickstart`).
2. **Display title** — label shown in the UI (e.g. "Pearl", "Quickstart").
3. **Icon** — one of: a path to an SVG in `public/images/` (e.g. `/images/pearl.svg`), or an Ant Design icon component name (e.g. `NotificationOutlined`). Ask the user which.
4. **Link URL** — the URL the platform button links to.
5. **Short description** — one sentence describing the platform for the table header tooltip.

Then update **all** of these files:

### a) `apps/operate/types/index.ts`
Add the new platform key to the `AvailableOn` union type:
```ts
export type AvailableOn = 'pearl' | 'quickstart' | 'contribute' | '<new-key>';
```

### b) `apps/operate/components/RunAgentButton.tsx`
Add a new entry in the `props` object (follow the existing pattern — use `<Image>` for SVG icons or the Ant Design icon component):
```ts
<newKey>: {
  icon: <Image src={`/images/<icon>.svg`} alt="<title>" width={18} height={18} />,
  text: '<Title>',
  href: '<url>',
},
```

### c) `apps/operate/components/Contracts/constants.tsx`
Add to the `PLATFORM_OPTIONS` array:
```ts
{ value: '<new-key>', label: '<Title>' },
```

### d) `apps/operate/components/Contracts/index.tsx`
Add a line to the "Available on" tooltip description (around line 142–150):
```tsx
<Text strong><Title></Text> - <short description>.
```

## Step 3: Add the contract entry

Edit `apps/operate/common-util/constants/contracts.ts` and add the contract to the `STAKING_CONTRACT_DETAILS` object.

### Address format
Addresses in this file are **zero-padded to 32 bytes** (66 characters total including `0x` prefix) and **fully lowercased**. The user may provide either format — always convert to the padded one.

**Standard address (42 chars):** `0x99Fe6B5C9980Fc3A44b1Dc32A76Db6aDfcf4c75e`
-> lowercase, then left-pad with 24 zeros after `0x`:
-> `0x00000000000000000000000099fe6b5c9980fc3a44b1dc32a76db6adfcf4c75e`

**Already padded (66 chars):** `0x00000000000000000000000099fe6b5c9980fc3a44b1dc32a76db6adfcf4c75e`
-> use as-is (ensure lowercase).

### Placement
Insert the new entry **next to related contracts** (group by name prefix). If unsure, append before the first unrelated group.

### Format
```ts
// <Contract Name>
'<zero-padded-address>': {
  availableOn: ['<platform1>', '<platform2>'],
},
```

## Step 4: Verify

Read back the modified file(s) to confirm the changes are correct. Report what was added.
