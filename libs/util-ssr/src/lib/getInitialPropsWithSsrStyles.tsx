// eslint-disable-next-line @next/next/no-document-import-in-page
import Document, { DocumentContext } from 'next/document';
import { StyleProvider, createCache, extractStyle } from '@ant-design/cssinjs';
import { ServerStyleSheet } from 'styled-components';

export const getInitialPropsWithSsrStyles = async (ctx: DocumentContext) => {
  const cache = createCache();
  const originalRenderPage = ctx.renderPage;
  const sheet = new ServerStyleSheet();

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => (
        <StyleProvider cache={cache}>{sheet.collectStyles(<App {...props} />)}</StyleProvider>
      ),
    });

  try {
    const initialProps = await Document.getInitialProps(ctx);
    const style = extractStyle(cache, true);
    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          {/* eslint-disable-next-line react/no-danger */}
          <style dangerouslySetInnerHTML={{ __html: style }} />
          {sheet.getStyleElement()}
        </>
      ),
    };
  } finally {
    sheet.seal();
  }
};
