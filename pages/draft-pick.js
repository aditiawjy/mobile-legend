import ManualDraftPick from '../components/draft/ManualDraftPick';
import Head from 'next/head';

export default function DraftPickPage() {
  return (
    <>
      <Head>
        <title>Tournament Draft Pick Simulator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>
      <ManualDraftPick />
    </>
  );
}
