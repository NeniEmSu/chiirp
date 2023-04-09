import { type AppType } from "next/app";

import { api } from "~/utils/api";

import { ClerkProvider } from "@clerk/nextjs";
import Head from "next/head";
import { Toaster } from "react-hot-toast";
import "~/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ClerkProvider {...pageProps}>
      <Head>
        <title>Chirp 🐦</title>
        <meta name="description" content="🐦 Emoji tweet app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Toaster/>
      <Component {...pageProps} />;
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
