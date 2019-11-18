# Starship
Starship is a module to make Discord's auth easier.
- ✅ Automatic token refreshing
- ✅ Routes are created automatically by the library
- 📦 < 10kB decompressed

## Starship is STILL unstable.
Starship is a new a package, created less than a month ago.
This means that the module may have some issues. Please, report them and I'll fix it ASAP.
If you need help setting or you're having an issue, you can contact me in Discord. I'm blueslimee#6723.

## Discord OAuth made easy
Starship was build to make Discord OAuth the easiest possible yet safe. Using JWT, all the communication between the client and the server is pretty safe.

## How does it work? How can I use it?
It's pretty simple. Starship will give to your website once the user is authenticated. You should use that token in every request.
The best part is that you can switch from passport-discord without having to do major changes to your server-side code. The biggest changes will be in your front-end code.
You'll have to store the token that Starship will provide to your (it doesn't matter where).
Then, to get the user's info, just create a GET request to `https://your-website.codes/auth/info/?token=jwt-token`.

## Where can I find examples?
soon tm