import { createCookieSessionStorage } from "@remix-run/server-runtime";
import { BoxyHQSAMLStrategy } from "../src";

describe(BoxyHQSAMLStrategy, () => {
  let verify = jest.fn();
  // You will probably need a sessionStorage to test the strategy.
  let sessionStorage = createCookieSessionStorage({
    cookie: { secrets: ["s3cr3t"] },
  });

  const options = Object.freeze({
    issuer: "https://jackson-demo.boxyhq.com",
    clientID: "MY_CLIENT_ID",
    clientSecret: "MY_CLIENT_SECRET",
    callbackURL: "https://example.com/callback",
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should have the name of the `boxyhq-saml`", () => {
    const strategy = new BoxyHQSAMLStrategy(options, verify);
    expect(strategy.name).toBe("boxyhq-saml");
  });

  test("should allow setting the clientID/Secret from the options", async () => {
    const strategy = new BoxyHQSAMLStrategy(options, verify);

    const request = new Request("https://example.app/auth/boxy-saml");
    try {
      await strategy.authenticate(request, sessionStorage, {
        successRedirect: "/private",
        failureRedirect: "/",
        sessionKey: "",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;
      let location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      let redirectUrl = new URL(location);
      expect(redirectUrl.searchParams.get("client_id")).toBe(`MY_CLIENT_ID`);
    }
  });

  test("should allow setting the clientID/Secret dynamically from the context", async () => {
    const strategy = new BoxyHQSAMLStrategy(options, verify);

    const request = new Request("https://example.app/auth/boxy-saml");
    try {
      await strategy.authenticate(request, sessionStorage, {
        successRedirect: "/private",
        failureRedirect: "/",
        context: {
          clientID: `tenant=boxyhq.com&product=demo`,
          clientSecret: "dummy",
        },
        sessionKey: "",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;
      let location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      let redirectUrl = new URL(location);
      expect(redirectUrl.searchParams.get("client_id")).toBe(
        `tenant=boxyhq.com&product=demo`
      );
    }
  });

  test("should correctly format the authorization URL", async () => {
    const strategy = new BoxyHQSAMLStrategy(options, verify);

    const request = new Request("https://example.app/auth/boxy-saml");
    try {
      await strategy.authenticate(request, sessionStorage, {
        successRedirect: "/private",
        failureRedirect: "/",
        sessionKey: "",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;
      let location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      let redirectUrl = new URL(location);
      expect(redirectUrl.hostname).toBe("jackson-demo.boxyhq.com");
      expect(redirectUrl.pathname).toBe("/api/oauth/authorize");
      expect(redirectUrl.searchParams.get("provider")).toBe(`saml`);
    }
  });
});
