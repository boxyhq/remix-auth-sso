import { SessionStorage } from "@remix-run/server-runtime";
import { AuthenticateOptions, StrategyVerifyCallback } from "remix-auth";
import {
  type OAuth2Profile,
  type OAuth2StrategyVerifyParams,
  OAuth2Strategy,
} from "remix-auth-oauth2";

/**
 * This interface declares what configuration the strategy needs from the
 * developer to correctly work.
 */
export interface BoxyHQSSOStrategyOptions {
  issuer: string;
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

export interface BoxyHQSSOProfile extends OAuth2Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  requested: Record<string, string>;
}

export class BoxyHQSSOStrategy<User> extends OAuth2Strategy<
  User,
  BoxyHQSSOProfile,
  never
> {
  name = "boxyhq-sso";
  private userInfoURL: string;

  constructor(
    options: BoxyHQSSOStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<BoxyHQSSOProfile, never>
    >
  ) {
    super(
      {
        authorizationURL: `${options.issuer}/api/oauth/authorize`,
        tokenURL: `${options.issuer}/api/oauth/token`,
        clientID: options.clientID,
        clientSecret: options.clientSecret,
        callbackURL: options.callbackURL,
      },
      verify
    );

    this.userInfoURL = `${options.issuer}/api/oauth/userinfo`;
  }

  async authenticate(
    request: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions
  ): Promise<User> {
    if (options.context?.clientID && options.context?.clientSecret) {
      this.clientID = options.context.clientID as string;
      this.clientSecret = options.context.clientSecret as string;
    }
    return super.authenticate(request, sessionStorage, options);
  }

  protected async userProfile(accessToken: string): Promise<BoxyHQSSOProfile> {
    let response = await fetch(this.userInfoURL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let data: BoxyHQSSOProfile = await response.json();

    let profile: BoxyHQSSOProfile = {
      ...data,
      provider: this.name,
    };

    return profile;
  }
}
