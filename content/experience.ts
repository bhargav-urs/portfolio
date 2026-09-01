import type { Education, Role } from "./types";

export const roles: Role[] = [
  {
    org: "DoJoGa",
    title: "Software Engineer",
    location: "Remote",
    start: "Apr 2026",
    end: "Present",
    impact:
      "Ships end to end product features across React/Next.js, TypeScript, Spring Boot/Node, and on chain Solidity surfaces used daily by the product's own users.",
    bullets: [
      "Build end to end product features across the full stack: React/Next.js and TypeScript on the frontend, Spring Boot/Node on the backend, and Solidity smart contracts integrated through ethers.js, shipping user facing surfaces used daily by the product's own users.",
      "Own feature design decisions in gray areas, balancing UX, data model constraints, and delivery speed, including how custodial and non custodial wallet connection flows fold into production user journeys, while working directly with a small, fast moving team.",
      "Write and review application code alongside automated test coverage, reviewing on chain logic for safety, isolating defects, reproducing reported issues on Linux based environments, and verifying fixes before release.",
      "Maintain CI driven test execution on every push so regressions surface as fast feedback rather than late in the release cycle.",
    ],
  },
  {
    org: "Torry Harris Integration Solutions",
    title: "Associate Software Engineer",
    location: "Bengaluru",
    start: "Aug 2023",
    end: "Dec 2023",
    impact:
      "Shipped the full product stack for TalenTrack, an internal employee skills platform serving 500+ users, in two week Agile sprints.",
    bullets: [
      "Architected 15+ REST APIs backed by a normalized MySQL schema (3NF), cutting average query response time 40% through indexed joins, eager loading strategies, and distributed CRUD patterns.",
      "Containerized services with Docker and deployed to a Kubernetes cluster using Helm, cutting deployment time from 20 minutes to 4 minutes with zero downtime rolling updates.",
      "Implemented OTP based auth and RBAC with Spring Security and JWT; wrote 80+ unit tests with JUnit/Mockito at 75% coverage; debugged production issues via shell scripting and log aggregation.",
    ],
  },
  {
    org: "Sal Biosciences Pvt Ltd",
    title: "Software Developer",
    location: "Bengaluru",
    start: "Nov 2022",
    end: "Jul 2023",
    impact:
      "Built full stack web applications and data ingestion pipelines used daily by research and business teams.",
    bullets: [
      "Designed REST APIs, relational data models, and responsive frontend views with rapid iteration cycles.",
      "Designed relational schemas and data ingestion pipelines consolidating operational datasets across projects, improving consistency and unblocking downstream analytics.",
      "Authored 40+ unit and integration tests and supported hybrid on premise and cloud deployments, catching regressions before they reached internal users.",
    ],
  },
  {
    org: "Quess Corp Limited",
    title: "Software Developer",
    location: "Bengaluru",
    start: "Sep 2022",
    end: "Oct 2022",
    impact:
      "Built an Android expense tracking app (Java, XML, Firebase Realtime DB) with budgeting, logging, and real time UI updates.",
    bullets: [
      "Cut data retrieval latency 60% through Firebase indexing and denormalizing read heavy access patterns for real time sync.",
    ],
  },
];

export const education: Education[] = [
  {
    school: "University of Texas at Arlington",
    degree: "MS Computer Science",
    location: "Arlington, Texas",
    start: "Jan 2024",
    end: "Dec 2025",
    detail: "GPA 3.75/4. Specializations in Data Sciences and Intelligent Systems.",
  },
  {
    school: "Visvesvaraya Technological University",
    degree: "BE Computer Science",
    location: "Bengaluru",
    start: "Aug 2019",
    end: "Jul 2023",
    detail: "GPA 3.8/4.",
  },
];
