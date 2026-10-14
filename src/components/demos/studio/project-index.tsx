"use client";

import { useState } from "react";
import { disciplines, projects, type Discipline } from "./content";

const filters = ["All", ...disciplines] as const;
type Filter = (typeof filters)[number];

/** The complete list of work, filterable by discipline. */
export function ProjectIndex() {
  const [filter, setFilter] = useState<Filter>("All");
  const shown =
    filter === "All"
      ? projects
      : projects.filter((project) => project.disciplines.includes(filter as Discipline));

  return (
    <div>
      <div className="flex flex-col gap-4 border-b-2 border-demo-fg pb-4 md:flex-row md:items-end md:justify-between">
        <div role="group" aria-label="Filter by discipline" className="-mx-1 flex flex-wrap gap-1">
          {filters.map((option) => {
            const count =
              option === "All"
                ? projects.length
                : projects.filter((project) => project.disciplines.includes(option)).length;
            const active = option === filter;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option)}
                className={`inline-flex h-10 items-center gap-2 px-3 text-sm font-semibold transition-colors ${
                  active ? "bg-demo-fg text-demo-bg" : "hover:bg-demo-fg/10"
                }`}
              >
                {option}
                <sup className="font-field-mono text-[0.625rem] font-normal opacity-60">{count}</sup>
              </button>
            );
          })}
        </div>
        <p aria-live="polite" className="font-field-mono text-xs uppercase opacity-60">
          Showing {shown.length} of {projects.length}
        </p>
      </div>

      <table className="w-full table-fixed text-left">
        <caption className="sr-only">
          All Field Office projects{filter === "All" ? "" : `, filtered to ${filter}`}
        </caption>
        <thead className="font-field-mono text-[0.6875rem] uppercase opacity-60">
          <tr>
            <th scope="col" className="w-12 py-3 font-normal md:w-[8.333%]">No.</th>
            <th scope="col" className="py-3 font-normal">Project</th>
            <th scope="col" className="hidden py-3 font-normal md:table-cell md:w-[25%]">Client</th>
            <th scope="col" className="hidden py-3 font-normal sm:table-cell sm:w-[30%] md:w-[25%]">Discipline</th>
            <th scope="col" className="w-14 py-3 text-right font-normal md:w-[8.333%]">Year</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((project) => (
            <tr
              key={project.index}
              className="group border-t border-demo-fg/20 transition-colors hover:bg-demo-fg hover:text-demo-bg"
            >
              <td className="py-4 align-baseline font-field-mono text-xs opacity-60 group-hover:opacity-100">
                {project.index}
              </td>
              <th
                scope="row"
                className="py-4 pr-4 align-baseline text-[clamp(1.25rem,1rem+1.2vw,2rem)] leading-[1.05] font-extrabold tracking-[-0.03em]"
              >
                {project.title}
                <span className="mt-1 block text-sm font-normal tracking-normal opacity-60 sm:hidden">
                  {project.disciplines.join(", ")}
                </span>
              </th>
              <td className="hidden py-4 pr-4 align-baseline text-sm md:table-cell">
                {project.client}
                <span className="block opacity-60">{project.location}</span>
              </td>
              <td className="hidden py-4 pr-4 align-baseline text-sm sm:table-cell">
                {project.disciplines.join(", ")}
              </td>
              <td className="py-4 text-right align-baseline font-field-mono text-xs tabular-nums">
                {project.year}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
