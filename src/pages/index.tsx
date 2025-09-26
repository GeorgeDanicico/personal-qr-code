import Head from "next/head";
import MainComponent from "@/components/main/MainComponent";

export default function Home() {
  return (
    <>
      <Head>
        <title>Personal QR Code</title>
        <meta name="description" content="Create a vCard QR code with your personal details." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MainComponent />
    </>
  );
}
