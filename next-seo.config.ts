const seoConfig = {
  title: 'ArbiSwap',
  description: 'The De-Fi Aggregator',
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/arbi-swap-logo.png',
    },
  ],
  openGraph: {
    title: 'ArbiSwap',
    type: 'website',
    url: process.env.NEXT_PUBLIC_OPEN_GRAPH_URL,
    description: 'The De-Fi Aggregator',
    images: [
      {
        url: 'https://arbi-swap-front.vercel.app/arbi-swap-og.png',
        type: 'image/png',
      },
    ],
    site_name: 'ArbiSwap',
  },
};
export default seoConfig;
