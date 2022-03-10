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
export interface BoxyHQSAMLStrategyOptions {
  issuer: string;
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

export interface BoxyHQSAMLProfile extends OAuth2Profile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export class BoxyHQSAMLStrategy<User> extends OAuth2Strategy<
  User,
  BoxyHQSAMLProfile,
  never
> {
  name = "boxyhq-saml";
  private userInfoURL: string;

  constructor(
    options: BoxyHQSAMLStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<BoxyHQSAMLProfile, never>
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
      this.clientID = options.context.clientID;
      this.clientSecret = options.context.clientSecret;
    }
    return super.authenticate(request, sessionStorage, options);
  }

  protected authorizationParams(): URLSearchParams {
    const urlSearchParams: Record<string, string> = {
      provider: "saml",
    };

    return new URLSearchParams(urlSearchParams);
  }

  protected async userProfile(accessToken: string): Promise<BoxyHQSAMLProfile> {
    let response = await fetch(this.userInfoURL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let data: BoxyHQSAMLProfile = await response.json();

    let profile: BoxyHQSAMLProfile = {
      ...data,
      provider: this.name,
    };

    return profile;
  }
}
