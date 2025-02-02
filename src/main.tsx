/* eslint-disable @typescript-eslint/no-explicit-any */
import { discussionService } from "@/services/discussion.service.ts";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import { AppLoading } from "./components/app/app-loading.tsx";
import "./index.css";
import { discussionControlService } from "@/services/discussion-control.service.ts";
import { discussionMemberService } from "@/services/discussion-member.service.ts";
import { discussionMembersResource, discussionsResource } from "@/resources/index.ts";

(window as any).discussionService = discussionService;
(window as any).discussionControlService = discussionControlService;
(window as any).discussionMemberService = discussionMemberService;
(window as any).discussionsResource = discussionsResource;
(window as any).discussionMembersResource = discussionMembersResource;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<AppLoading />}>
      <App />
    </Suspense>
  </React.StrictMode>
);


