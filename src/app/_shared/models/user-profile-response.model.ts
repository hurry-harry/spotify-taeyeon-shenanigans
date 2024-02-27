import { ExternalUrls, Followers, Image } from "./spotify.model";

export interface UserProfileResponse {
    country: string;
    display_name: string;
    // email: string // removed due to user-read-email scope not being included in Auth
    explicit_content: ExplicitContent;
    external_urls: ExternalUrls;
    followers: Followers;
    href: string;
    id: string;
    images: Image[];
    // product: string; // removed due to user-read-private scope not being included in Auth
    type: string;
    uri: string;
}

export interface ExplicitContent {
    filter_enabled: boolean;
    filter_locked: boolean;
}
