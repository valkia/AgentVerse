import { BusProxy } from "../bus-proxy";
import { createKey } from "../key";
import { MiddlewareChain } from "../middleware-chain";
import {
  IBusStatus,
  ICapabilityBus,
  IEnvironmentBus,
  IEventBus,
  IInternalCapabilityBus,
  IInternalMessageBus,
  IInternalResourceBus,
  IInternalStateBus,
  IMessageBus,
  IMiddleware,
  IResourceBus,
  IStateBus
} from "../types";
import { CapabilityBus } from "./capability-bus";
import { EventBus } from "./event-bus";
import { MessageBus } from "./message-bus";
import { ResourceBus } from "./resource-bus";
import { StateBus } from "./state-bus";

export class EnvironmentBus implements IEnvironmentBus {
  private static RESET_KEY = createKey<unknown>("__environment.reset__");
  private static STATUS_KEY = createKey<IBusStatus>("__environment.status__");

  readonly event: IEventBus;
  readonly state: IStateBus;
  readonly message: IMessageBus;
  readonly resource: IResourceBus;
  readonly capability: ICapabilityBus;

  private middlewareChain = new MiddlewareChain();
  private internalState: IInternalStateBus;
  private internalMessage: IInternalMessageBus;
  private internalResource: IInternalResourceBus;
  private internalCapability: IInternalCapabilityBus;

  constructor() {
    this.internalState = new StateBus() as IInternalStateBus;
    this.internalMessage = new MessageBus() as IInternalMessageBus;
    this.internalResource = new ResourceBus() as IInternalResourceBus;
    this.internalCapability = new CapabilityBus() as IInternalCapabilityBus;

    this.event = new BusProxy(
      new EventBus(),
      "event",
      this.middlewareChain
    ).createProxy();
    this.state = new BusProxy(
      this.internalState,
      "state",
      this.middlewareChain
    ).createProxy();
    this.message = new BusProxy(
      this.internalMessage,
      "message",
      this.middlewareChain
    ).createProxy();
    this.resource = new BusProxy(
      this.internalResource,
      "resource",
      this.middlewareChain
    ).createProxy();
    this.capability = new BusProxy(
      this.internalCapability,
      "capability",
      this.middlewareChain
    ).createProxy();
  }

  use(middleware: IMiddleware<unknown>) {
    this.middlewareChain.add(middleware);
    return () => this.removeMiddleware(middleware);
  }

  removeMiddleware(middleware: IMiddleware<unknown>): void {
    this.middlewareChain.remove(middleware);
  }

  async reset(): Promise<void> {
    const context = {
      busType: "event" as const,
      operation: "reset",
      key: EnvironmentBus.RESET_KEY,
      data: null,
      metadata: {},
    };

    try {
      await this.middlewareChain.executeBefore(context);

      // 清理所有状态
      const stateKeys = Array.from(this.internalState.states.keys()).map((id) =>
        createKey<unknown>(id)
      );
      stateKeys.forEach((key) => this.state.reset(key));

      // 清理所有消息
      const messageKeys = Array.from(this.internalMessage.messages.keys()).map(
        (id) => createKey<unknown>(id)
      );
      await Promise.all([
        ...messageKeys.map((key) => this.message.clear(key)),
        ...Array.from(this.capability.list()).map((key) =>
          this.capability.unregister(key)
        ),
      ]);

      // 重置资源和能力
      this.internalResource.reset();
      this.internalCapability.reset();

      await this.middlewareChain.executeAfter(context);
    } catch (error) {
      await this.middlewareChain.executeError(error as Error, context);
      throw error;
    }
  }

  status(): IBusStatus {
    const status = {
      event: true,
      state: true,
      message: true,
      resource: true,
      capability: true,
    };

    this.state.set(EnvironmentBus.STATUS_KEY, status);
    return status;
  }
}
