import type { Subsystem } from "../types";

export const chainvote: Subsystem = {
  slug: "chainvote",
  name: "ChainVote",
  oneLine:
    "A voting platform where the tally lives in a smart contract rather than a database, and every ballot is a publicly verifiable transaction.",
  statusMode: "checked",
  live: {
    label: "Live",
    href: "https://blockchain-voting-self.vercel.app",
    host: "blockchain-voting-self.vercel.app",
  },
  repo: {
    label: "Repository",
    href: "https://github.com/bhargav-urs/blockchain-voting",
    host: "github.com",
  },
  canvas: { w: 980, h: 620 },
  boundaries: [
    {
      id: "amoy",
      label: "Polygon Amoy (chain 80002)",
      note: "enforcement lives here",
      x: 640,
      y: 100,
      w: 300,
      h: 400,
    },
  ],
  nodes: [
    {
      id: "client",
      label: "Next.js 14 client",
      sub: "App Router",
      kind: "client",
      x: 40,
      y: 60,
      w: 210,
      h: 72,
      detail: {
        role: "Renders election lists, the voting flow, and live results; results pages are read-only and work with no wallet installed.",
        why: "The App Router splits the public read pages from the wallet-gated write flows, and hand-written CSS keeps the bundle to what the pages actually use.",
        rejected:
          "A UI framework. The design is a handful of custom components, and a framework would spend bundle on look-alike widgets.",
        breaks:
          "Results auto-refresh every 15 seconds by polling reads. Many concurrent viewers multiply RPC traffic; a shared cache or push channel is the fix beyond that.",
      },
    },
    {
      id: "wallet",
      label: "lib/adapters/wallet.ts",
      sub: "EIP-1193 singleton",
      kind: "client",
      x: 40,
      y: 210,
      w: 210,
      h: 64,
      detail: {
        role: "One singleton that owns MetaMask detection, account and chain state, and network switching.",
        why: "Wallet state is global by nature. A single adapter means every component sees the same account and chain, and wallet_switchEthereumChain plus wallet_addEthereumChain live in exactly one place.",
        rejected:
          "A wallet connection library. Convenient, but it drags in support for dozens of wallets this app does not target and hides the EIP-1193 calls worth understanding.",
        breaks:
          "It assumes a single injected provider. Multiple wallet extensions fight over window.ethereum; EIP-6963 multi-provider discovery is the proper fix.",
      },
    },
    {
      id: "svc",
      label: "lib/services/blockchain.ts",
      sub: "read/write split",
      kind: "client",
      x: 40,
      y: 350,
      w: 210,
      h: 64,
      detail: {
        role: "The one module through which every chain interaction flows, split into a read path and a write path.",
        why: "Reads go through a public RPC pool with no wallet required, which is why the public results pages work with MetaMask not installed at all. Writes go through the signer.",
        rejected:
          "Calling ethers directly from components. It scatters provider handling across the UI and makes the failover policy untestable.",
        breaks:
          "The module is a singleton per tab, so there is no shared cache across viewers and every open results page pays for its own polling.",
      },
    },
    {
      id: "rpc",
      label: "Public RPC pool",
      sub: "ordered failover",
      kind: "external",
      x: 340,
      y: 210,
      w: 200,
      h: 72,
      detail: {
        role: "An ordered list of public JSON-RPC providers, probed for health, cached, and rotated when a node dies mid-session.",
        why: "Polygon retired its public Amoy endpoint and the hostname stopped resolving in DNS. Every read died as a bare \"Failed to fetch.\" The pool probes for the first healthy node and filters the retired host by name, so a stale environment variable cannot take the app down again.",
        rejected: "One RPC URL in an environment variable. That is exactly what failed in production.",
        breaks:
          "Public nodes prune history and rate-limit unpredictably. The chunked log reader compensates, but a dedicated RPC key is the real fix at scale.",
      },
    },
    {
      id: "metamask",
      label: "MetaMask signer",
      kind: "external",
      x: 340,
      y: 350,
      w: 200,
      h: 64,
      detail: {
        role: "Holds the keys and signs every write. The app never touches a private key.",
        why: "Signing belongs in the user's wallet. The app builds the transaction, sets gas for Amoy's floor, and hands it over.",
        rejected:
          "A custodial signer with server-held keys, which would turn a verifiable voting demo into a trust-me service.",
        breaks:
          "Wallets do not always fetch Amoy's minimum gas price correctly, causing first-attempt failures. The write path reads live fee data, buffers 25%, and floors at 30 gwei, which handles today's failure mode but hardcodes today's floor.",
      },
    },
    {
      id: "factory",
      label: "ElectionFactory contract",
      sub: "125 lines Solidity",
      kind: "service",
      x: 670,
      y: 150,
      w: 240,
      h: 64,
      detail: {
        role: "Deploys each election as its own contract and is the single known address from which every election is discovered.",
        why: "A factory means one election's state cannot corrupt another's, each election gets its own explorer page, and the frontend needs exactly one address in configuration.",
        rejected:
          "A monolithic contract holding every election in mappings. Cheaper to deploy once, but a storage bug in one election becomes a bug in all of them.",
        breaks:
          "Discovery walks the factory's event history, which on pruned public nodes requires the chunked log reader. A subgraph-style indexer is the conventional fix beyond that.",
      },
    },
    {
      id: "elections",
      label: "Election contracts",
      sub: "one per election, 267 lines",
      kind: "service",
      x: 670,
      y: 300,
      w: 240,
      h: 72,
      detail: {
        role: "Enforces the rules per election: whitelist membership, one vote per address, valid candidate identifier, open time window, admin-only actions.",
        why: "Enforcement lives in the contract, not the interface. Disabling a button is not a security control; calling the contract directly from a script bypasses nothing.",
        rejected:
          "Enforcing rules in the frontend and trusting the interface. Anyone with a wallet and five lines of script could vote twice.",
        breaks:
          "VoteCast emits candidateId as an indexed parameter, so who voted for whom is derivable from chain data. True ballot secrecy needs commit-reveal or zero-knowledge proofs, out of scope for this build.",
      },
    },
    {
      id: "polygonscan",
      label: "PolygonScan",
      sub: "verification",
      kind: "external",
      x: 670,
      y: 530,
      w: 240,
      h: 56,
      detail: {
        role: "Independent verification: contract source, every transaction, every event, readable by anyone.",
        why: "A voting system's claim is auditability. Pointing at a third-party explorer keeps the audit path independent of this app entirely.",
        rejected:
          "An in-app transaction viewer only, which would ask users to trust the same interface the vote came from.",
        breaks:
          "Explorer availability is outside this system's control. The chain remains the source of truth either way.",
      },
    },
  ],
  edges: [
    { from: "client", to: "wallet", fromSide: "bottom", toSide: "top" },
    { from: "client", to: "svc", fromSide: "left", toSide: "left", bend: 20 },
    { from: "svc", to: "rpc", fromSide: "right", toSide: "left", fromAt: 0.25, bend: 296, label: "read" },
    { from: "svc", to: "metamask", fromSide: "right", toSide: "left", label: "write" },
    { from: "rpc", to: "factory", fromSide: "right", toSide: "left", bend: 600, label: "JSON-RPC", dashed: true },
    { from: "metamask", to: "factory", fromSide: "right", toSide: "left", toAt: 0.75, bend: 620, label: "signed tx" },
    { from: "factory", to: "elections", fromSide: "bottom", toSide: "top", label: "deploys" },
    { from: "elections", to: "polygonscan", fromSide: "bottom", toSide: "top", dashed: true, label: "verification" },
  ],
  decisions: [
    {
      title: "Enforcement lives in the contract",
      decision:
        "Whitelist membership, one vote per address, valid candidate identifier, open time window, and admin-only actions are all enforced in Solidity and independently tested.",
      constraint: "Anyone can call a public contract directly from a script. The interface is not a boundary.",
      rejected: "Interface-level enforcement. Disabling a button is not a security control.",
      consequence:
        "Calling the contract directly bypasses nothing, and every rule costs gas because it runs on chain.",
    },
    {
      title: "A factory per deployment, a contract per election",
      decision: "ElectionFactory deploys each election as its own contract.",
      constraint: "One election's state must not be able to corrupt another's.",
      rejected: "A monolithic contract with every election in mappings.",
      consequence:
        "Each election gets its own explorer page, and the frontend needs exactly one known address to discover all of them.",
    },
    {
      title: "Reads and writes are split",
      decision:
        "Reads go through a public RPC pool with no wallet required; writes go through the MetaMask signer.",
      constraint: "Public results pages must work with MetaMask not installed at all.",
      rejected: "Routing everything through the wallet's provider.",
      consequence: "Two code paths to maintain, and the read path needs its own failover story.",
    },
    {
      title: "A production DNS incident, diagnosed and designed out",
      decision:
        "The read path walks an ordered list of providers, probes for the first healthy one, caches it, rotates automatically if a node dies mid-session, and filters the retired host by name.",
      constraint:
        "Polygon retired its public Amoy RPC endpoint and the hostname stopped resolving in DNS. Every read in the deployed app died as a bare \"Failed to fetch\" and the site went blank. The failure was traced from the browser console down to DNS.",
      rejected: "Pointing the environment variable at a different single provider.",
      consequence:
        "A stale environment variable can no longer take the app down, at the cost of a health probe on cold start.",
    },
    {
      title: "Event history under free infrastructure",
      decision:
        "The log reader locates the election's creation block by binary search over block timestamps, walks the range in 9,000-block chunks, detects pruning responses specifically, rotates to a node that retained the history, and applies timeouts at every stage with one retry on transient failures.",
      constraint:
        "Public RPCs reject unbounded eth_getLogs and most prune old blocks, returning \"history has been pruned\" rather than an error, which silently reads as \"no votes.\"",
      rejected: "One eth_getLogs call over the full range, which free providers reject.",
      consequence:
        "Reading history is slower and chattier, but it is correct on pruned nodes and it can tell \"no votes\" from \"no data.\"",
    },
    {
      title: "Chain-specific gas handling",
      decision: "The write path reads live fee data, applies a 25% buffer, and floors the price at 30 gwei.",
      constraint:
        "Amoy enforces a minimum gas price that wallets do not always fetch correctly, causing first-attempt failures.",
      rejected: "Letting the wallet estimate on its own.",
      consequence:
        "Votes cost marginally more than the theoretical minimum, and the floor is a constant to revisit if the chain changes.",
    },
    {
      title: "Custom errors, immutable storage",
      decision:
        "Custom Solidity error types instead of require strings, and immutable storage for the owner and factory addresses.",
      constraint: "Every byte of revert data and every storage slot costs gas.",
      rejected: "require with revert strings: cheaper to write, costlier to run.",
      consequence: "Cheaper reverts, typed errors on the client, and addresses fixed at deployment.",
    },
    {
      title: "ABI as signature strings",
      decision:
        "Contract interfaces are stored as human-readable ethers signature strings rather than compiled JSON artifacts.",
      constraint: "The frontend bundle and code review both pay for every artifact byte.",
      rejected: "Importing compiled ABI JSON from the build output.",
      consequence:
        "The bundle stays small and the ABI is readable in a diff, but signatures are updated by hand when the contract changes.",
    },
  ],
  limitations: [
    "Vote choice is hidden at the interface layer: the UI never exposes it and there is no getter for another voter's choice. But all chain state is publicly readable regardless of Solidity visibility, and VoteCast emits candidateId as an indexed event parameter, so who voted for whom is derivable from the chain. This is not ballot secrecy in the cryptographic sense. Achieving that would require commit-reveal or zero-knowledge proofs, which was out of scope for this build and is the natural next step.",
  ],
  stack: [
    { tech: "solidity", label: "Solidity ^0.8.24", group: "contracts", nodes: ["factory", "elections"] },
    { tech: "hardhat", label: "Hardhat + Toolbox", group: "contracts", nodes: ["factory", "elections"] },
    { tech: "chai", label: "Chai", group: "testing", nodes: ["elections"] },
    { tech: "solc-optimizer", label: "solc optimizer, 200 runs", group: "contracts", nodes: ["factory", "elections"] },
    { tech: "polygon-amoy", label: "Polygon Amoy (chain 80002)", group: "contracts", nodes: ["factory", "elections"] },
    { tech: "ethers", label: "ethers.js v6", group: "frontend", nodes: ["svc"] },
    { tech: "json-rpc", label: "JSON-RPC multi-provider failover", group: "frontend", nodes: ["rpc"] },
    { tech: "polygonscan-svc", label: "PolygonScan", group: "infra", nodes: ["polygonscan"] },
    { tech: "metamask", label: "MetaMask, EIP-1193, chain switching", group: "frontend", nodes: ["wallet", "metamask"] },
    { tech: "nextjs", label: "Next.js 14 App Router", group: "frontend", nodes: ["client"] },
    { tech: "react", label: "React 18", group: "frontend", nodes: ["client"] },
    { tech: "typescript", label: "TypeScript strict", group: "frontend", nodes: ["client", "wallet", "svc"] },
    { tech: "hand-css", label: "Hand-written CSS, custom properties", group: "frontend", nodes: ["client"] },
    { tech: "vercel", label: "Vercel", group: "infra", nodes: ["client"] },
    { tech: "eslint", label: "ESLint", group: "infra", nodes: ["client"] },
    { tech: "dotenv", label: "dotenv", group: "infra", nodes: ["factory"] },
    { tech: "npm-scripts", label: "npm scripts wrapping Hardhat", group: "infra", nodes: ["factory", "elections"] },
  ],
  metrics: [
    { value: "~3,600", label: "lines of TypeScript and Solidity" },
    { value: "392", label: "lines of Solidity across 2 contracts: ElectionFactory 125, Election 267" },
    { value: "27", label: "passing contract tests" },
    { value: "4", label: "deployed routes" },
    { value: "1", label: "known address needed to discover every election on chain" },
    { value: "15 s", label: "auto-refresh interval on results pages" },
  ],
  trace: {
    mode: "live",
    target: "chainvote",
    description:
      "Fires one real read-only JSON-RPC call at the public Amoy pool the app itself reads through, and times each hop.",
  },
  screens: [],
  readerSummary:
    "A voting platform where the tally lives in a smart contract and every ballot is a publicly verifiable transaction on Polygon Amoy. Enforcement is in Solidity, not the interface: whitelist, one vote per address, valid candidate, time window. Reads run walletless through a failover RPC pool; a real DNS outage of Polygon's public endpoint was diagnosed and designed out. 27 passing contract tests.",
};
