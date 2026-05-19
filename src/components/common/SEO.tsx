import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  path: string;
  ogType?: "website" | "article";
}

const SITE_URL = "https://build-pay-certify.lovable.app";

const SEO = ({ title, description, path, ogType = "website" }: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
    </Helmet>
  );
};

export default SEO;
