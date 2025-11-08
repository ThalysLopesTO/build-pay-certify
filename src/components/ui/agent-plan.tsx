"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDotDashed,
  CircleX,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

// Type definitions
interface Subtask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  tools?: string[]; // Optional array of MCP server tools
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  level: number;
  dependencies: string[];
  subtasks: Subtask[];
}

// Initial task data
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Research Project Requirements",
    description:
      "Gather all necessary information about project scope and requirements",
    status: "in-progress",
    priority: "high",
    level: 0,
    dependencies: [],
    subtasks: [
      {
        id: "1.1",
        title: "Interview stakeholders",
        description:
          "Conduct interviews with key stakeholders to understand needs",
        status: "completed",
        priority: "high",
        tools: ["communication-agent", "meeting-scheduler"],
      },
      {
        id: "1.2",
        title: "Review existing documentation",
        description:
          "Go through all available documentation and extract requirements",
        status: "in-progress",
        priority: "medium",
        tools: ["file-system", "browser"],
      },
      {
        id: "1.3",
        title: "Compile findings report",
        description:
          "Create comprehensive report of all gathered requirements",
        status: "pending",
        priority: "medium",
        tools: ["editor"],
      },
    ],
  },
  {
    id: "2",
    title: "Design System Architecture",
    description: "Create technical design and architecture documents",
    status: "pending",
    priority: "high",
    level: 1,
    dependencies: ["1"],
    subtasks: [
      {
        id: "2.1",
        title: "Define system components",
        description: "Identify and document all major system components",
        status: "pending",
        priority: "high",
        tools: ["diagram-tool", "editor"],
      },
      {
        id: "2.2",
        title: "Create data flow diagrams",
        description:
          "Design diagrams showing how data moves through the system",
        status: "pending",
        priority: "medium",
        tools: ["diagram-tool"],
      },
      {
        id: "2.3",
        title: "Document API specifications",
        description: "Write detailed API documentation and specifications",
        status: "pending",
        priority: "high",
        tools: ["api-doc-generator", "editor"],
      },
    ],
  },
  {
    id: "3",
    title: "Implement Core Features",
    description: "Build the main functionality of the application",
    status: "pending",
    priority: "high",
    level: 2,
    dependencies: ["2"],
    subtasks: [
      {
        id: "3.1",
        title: "Set up development environment",
        description:
          "Configure development tools, dependencies, and local environment",
        status: "pending",
        priority: "high",
        tools: ["package-manager", "version-control"],
      },
      {
        id: "3.2",
        title: "Implement authentication system",
        description: "Build user authentication and authorization",
        status: "pending",
        priority: "high",
        tools: ["code-editor", "database"],
      },
      {
        id: "3.3",
        title: "Create main application features",
        description:
          "Develop the core features identified in requirements phase",
        status: "pending",
        priority: "high",
        tools: ["code-editor", "framework-cli"],
      },
    ],
  },
  {
    id: "4",
    title: "Testing and Quality Assurance",
    description: "Ensure application quality through comprehensive testing",
    status: "pending",
    priority: "medium",
    level: 3,
    dependencies: ["3"],
    subtasks: [
      {
        id: "4.1",
        title: "Write unit tests",
        description: "Create tests for individual components and functions",
        status: "pending",
        priority: "high",
        tools: ["test-framework", "code-editor"],
      },
      {
        id: "4.2",
        title: "Perform integration testing",
        description: "Test how different parts of the system work together",
        status: "pending",
        priority: "medium",
        tools: ["test-framework", "api-client"],
      },
      {
        id: "4.3",
        title: "Conduct user acceptance testing",
        description: "Have users test the application and gather feedback",
        status: "pending",
        priority: "medium",
        tools: ["feedback-collector", "bug-tracker"],
      },
    ],
  },
];

// Status icon component
const StatusIcon = ({ status }: { status: string }) => {
  const iconProps = { className: "w-5 h-5" };

  switch (status) {
    case "completed":
      return <CheckCircle2 {...iconProps} className="w-5 h-5 text-green-500" />;
    case "in-progress":
      return (
        <CircleDotDashed {...iconProps} className="w-5 h-5 text-blue-500" />
      );
    case "blocked":
      return <CircleAlert {...iconProps} className="w-5 h-5 text-red-500" />;
    case "failed":
      return <CircleX {...iconProps} className="w-5 h-5 text-red-600" />;
    default:
      return <Circle {...iconProps} className="w-5 h-5 text-muted-foreground" />;
  }
};

// Priority badge component
const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    medium:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[priority as keyof typeof colors] || colors.low}`}
    >
      {priority}
    </span>
  );
};

// Subtask component
const SubtaskItem = ({ subtask }: { subtask: Subtask }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="ml-8 mb-2 p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start gap-3">
        <StatusIcon status={subtask.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-foreground">
              {subtask.title}
            </h4>
            <PriorityBadge priority={subtask.priority} />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <p className="text-sm text-muted-foreground">
                  {subtask.description}
                </p>
                {subtask.tools && subtask.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {subtask.tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Main task component
const TaskItem = ({ task }: { task: Task }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedSubtasks = task.subtasks.filter(
    (st) => st.status === "completed"
  ).length;
  const totalSubtasks = task.subtasks.length;
  const progress = (completedSubtasks / totalSubtasks) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4 p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      <div
        className="flex items-start gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <StatusIcon status={task.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground">
              {task.title}
            </h3>
            <PriorityBadge priority={task.priority} />
            <span className="text-xs text-muted-foreground">
              {completedSubtasks}/{totalSubtasks} tasks
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {task.description}
          </p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Dependencies */}
          {task.dependencies.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span>Depends on:</span>
              {task.dependencies.map((dep) => (
                <span
                  key={dep}
                  className="px-2 py-0.5 bg-muted rounded border border-border"
                >
                  Task {dep}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subtasks */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <LayoutGroup>
              {task.subtasks.map((subtask) => (
                <SubtaskItem key={subtask.id} subtask={subtask} />
              ))}
            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main component
export default function AgentPlan() {
  const [tasks] = useState<Task[]>(initialTasks);

  // Group tasks by level for hierarchical display
  const tasksByLevel = tasks.reduce(
    (acc, task) => {
      if (!acc[task.level]) acc[task.level] = [];
      acc[task.level].push(task);
      return acc;
    },
    {} as Record<number, Task[]>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Agent Task Plan</h1>
        <p className="text-muted-foreground">
          Hierarchical breakdown of project tasks and dependencies
        </p>
      </div>

      <LayoutGroup>
        {Object.keys(tasksByLevel)
          .sort((a, b) => Number(a) - Number(b))
          .map((level) => (
            <div key={level} className="space-y-4">
              {tasksByLevel[Number(level)].map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ))}
      </LayoutGroup>
    </div>
  );
}
