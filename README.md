# Driview-front

Driview frontend — [Expo](https://expo.dev) app with [`expo-router`](https://docs.expo.dev/router/introduction).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. **Environment (required for login / signup / stats API)**  
   `.env` is not committed. Copy the example and set the API base URL (same as Swagger **Servers**).

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```
   EXPO_PUBLIC_API_BASE_URL=http://YOUR_HOST:PORT
   ```

   No trailing slash. Restart Metro after changing env vars.

3. Start the app

   ```bash
   npm start
   ```

You can open the app in a development build, Android emulator, iOS simulator, or [Expo Go](https://expo.dev/go). Edit files in the **app** directory (file-based routing).

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/)
