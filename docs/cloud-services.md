# Cloud services

## Battle.net

### Setup

Battle.net OAuth is used to authenticate users.

To get started, go to the [Battle.net developer portal](https://community.developer.battle.net/) and log in with your Battle.net account.

Go to the API Access page, and create a new client:

- `Client Name` can be whatever you want.
- `Redirect URLs` must include `http://localhost:5173/api/login/battlenet/callback`.
- `Service URL` doesn't seem to matter, but put `http://localhost:5173` to be safe.
- `Intended Use` can be something like "Authenticate users by Battletag".

Once created, copy the Client ID and Client Secret to the respective fields within the `.env` file.

You should now be able to log in to the website using your Battle.net credentials. If the superadmin you created in the setup phase matches your Battletag, this will log you into the existing user account. If not, it will create a new (non-admin) account.

## Cloudflare

Cloudflare is used in two ways:

- File storage with [Cloudflare R2](https://www.cloudflare.com/developer-platform/products/r2/). This is used for storing team logos and the landing page hero/trailer video. Any S3-compatible storage can technically be used, but R2 is preferred due to its generous free tier and easy integration with Images.
- Image serving and optimization via [Cloudflare Images](https://www.cloudflare.com/developer-platform/products/cloudflare-images/).

To set these up for yourself, [create a Cloudflare account](https://dash.cloudflare.com/login) and navigate to the [Dashboard](https://dash.cloudflare.com).

Cloudflare may ask you for credit card information on sign up. Don't worry about that as your usage will fall well below the free tier threshold.

### R2 Object Storage

[Create a new R2 bucket](https://dash.cloudflare.com/9c3c36808f7b9a5adadff441d7f2ddcd/r2/overview). The project is by default configured to use a bucket named "dunderligan", however you can pick any name as long as it's reflected in the environment file. Leave `Location` as is, and pick the the `Standard` storage class.

Navigate to the `Settings` tab, find `Public Development URL` and click `Enable`. Copy the url into the `PUBLIC_CDN_ENDPOINT` field of the `.env` file.

Go back to the main R2 page, find `API Tokens` on the right sidebar and click `Manage`.

Create a new API token. For permissions, pick `Object Read & Write`. The rest of the options are up to preference.

Cloudflare will now show the `Access Key ID`, `Secret Access Key` and S3 endpoint for the newly created API token. Copy the three values into their respective fields of the `.env` file. **These will not be shown again!**

R2 should now be working. However, team logos still won't show until you've setup Images as well. Nevertheless, you can still test it out by uploading a team logo via the admin page and, via the Cloudflare dashboard, check that it was added to the R2 bucket.

### Images

TODO: figure out how to do this in a dev environment without a purchased domain on cloudflare.
