/* eslint-disable @typescript-eslint/no-explicit-any */
import { discussionService } from "@/services/discussion.service.ts";
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import { AppLoading } from "./components/app/app-loading.tsx";
import "./index.css";

(window as any).discussionService = discussionService;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<AppLoading />}>
      <App />
    </Suspense>
  </React.StrictMode>
);
