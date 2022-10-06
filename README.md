# BoxyHQSSOStrategy

**Attention ⚠️**: We have deprecated the earlier strategy `BoxyHQSAMLStrategy` (npm package: `@boxyhq/remix-auth-saml`). In case you are using that one please consider changing over to this strategy.

The BoxyHQSSOStrategy can be used to enable Single Sign-On (SSO) in your remix app. It extends the OAuth2Strategy.

# Demo

Checkout the demo at https://github.com/boxyhq/jackson-remix-auth

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

<!-- If it doesn't support one runtime, explain here why -->

## SAML Jackson Service

SAML Jackson implements SSO as an OAuth 2.0 flow, abstracting away all the complexities of the underlying SAML/OIDC protocol.

You can deploy SAML Jackson as a separate service. [Check out the documentation for more details](https://boxyhq.com/docs/jackson/deploy)

## Configuration

SSO login requires a connection for every tenant/product of yours. One common method is to use the domain for an email address to figure out which tenant they belong to. You can also use a unique tenant ID (string) from your backend for this, typically some kind of account or organization ID.

Check out the [documentation](https://boxyhq.com/docs/jackson/sso-flow/#21-add-connection) for more details.

## Usage

### Install the strategy

```bash
npm install @boxyhq/remix-auth-sso
```

### Create the strategy instance

```ts
// app/utils/auth.server.ts
import { Authenticator } from "remix-auth";
import {
  BoxyHQSSOStrategy,
  type BoxyHQSSOProfile,
} from "@boxyhq/remix-auth-saml";

// Create an instance of the authenticator, pass a generic with what your
// strategies will return and will be stored in the session
export const authenticator = new Authenticator<BoxyHQSSOProfile>(
  sessionStorage
);

auth.use(
  new BoxyHQSSOStrategy(
    {
      issuer: "http://localhost:5225", // point this to the hosted jackson service
      clientID: "dummy", // The dummy here is necessary if the tenant and product are set dynamically from the client side
      clientSecret: "dummy", // The dummy here is necessary if the tenant and product are set dynamically from the client side
      callbackURL: new URL(
        "/auth/saml/callback",
        process.env.BASE_URL
      ).toString(), // BASE_URL should point to the application URL
    },
    async ({ profile }) => {
      return profile;
    }
  )
);
```

### Setup your routes

```tsx
// app/routes/login.tsx
export default function Login() {
  return (
    <Form method="post" action="/auth/sso">
      {/* We will be using user email to identify the tenant*/}
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        name="email"
        placeholder="johndoe@example.com"
        required
      />
      {/* Product can also be set dynamically, set to `demo` here */}
      <input type="text" name="product" hidden defaultValue="demo" />
      <button type="submit">Sign In with SSO</button>
    </Form>
  );
}
```

```tsx
// app/routes/auth/sso.tsx
import { ActionFunction, json } from "remix";
import { auth } from "~/auth.server";
import invariant from "tiny-invariant";

type PostError = {
  email?: boolean;
  product?: boolean;
};
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const email = formData.get("email");
  const product = await formData.get("product");

  const errors: PostError = {};
  if (!email) errors.email = true;
  if (!product) errors.product = true;

  if (Object.keys(errors).length) {
    return json(errors);
  }

  invariant(typeof email === "string");
  // Get the tenant from the domain
  const tenant = email.split("@")[1];
  return await auth.authenticate("boxyhq-sso", request, {
    successRedirect: "/private",
    failureRedirect: "/",
    context: {
      clientID: `tenant=${tenant}&product=${product}`,
      clientSecret: "dummy",
    },
  });
};
```

```tsx
// app/routes/auth/sso/callback.tsx
import type { LoaderFunction } from "remix";
import { auth } from "~/auth.server";

export const loader: LoaderFunction = async ({ request, params }) => {
  return auth.authenticate("boxyhq-sso", request, {
    successRedirect: "/private",
    failureRedirect: "/",
  });
};
```
