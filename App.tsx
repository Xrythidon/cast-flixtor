import { useState } from "react";
import { Button, StyleSheet, View } from "react-native";
import WebView from "react-native-webview";
import GoogleCast, { CastButton, useRemoteMediaClient, CastState, useCastState } from "react-native-google-cast";
import { StatusBar } from "expo-status-bar";

function TestCastComponent({contentUrl}: {contentUrl: string}) {
  // This will automatically rerender when client is connected to a device
  // (after pressing the button that's rendered below)
  const client = useRemoteMediaClient()
  const castState = useCastState()

  console.log("contentUrl", contentUrl)

  if (client) {
    // Send the media to your Cast device as soon as we connect to a device
    // (though you'll probably want to call this later once user clicks on a video or something)
    client.loadMedia({
      mediaInfo: {
        contentUrl,
        contentType: "application/x-mpegURL",
      },
    })
  }


  // This will render native Cast button.
  // When a user presses it, a Cast dialog will prompt them to select a Cast device to connect to.


  return (
    <>
      {castState === CastState.CONNECTED && (
        <Button
          title="Controller"
          onPress={() => {
            GoogleCast.showExpandedControls();
          }}
        />
      )}
      <CastButton style={{ width: 24, height: 24, tintColor: "black" }} />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  const [castUrl, setCastUrl] = useState();

  return (
    <>
      <View style={styles.castContainer}>
        <TestCastComponent contentUrl={castUrl} />
      </View>
      <CustomHeaderWebView
        javaScriptEnabled={true}
        style={styles.container}
        source={{
          uri: "https://flixtor.to/home",
        }}
        sharedCookiesEnabled={true}
        injectedJavaScriptBeforeContentLoaded={runFirst}
        
        onMessage={(event) => {
          console.log(JSON.parse(event.nativeEvent.data).url)
          setCastUrl(JSON.parse(event.nativeEvent.data).url)
        }}
      />
    </>
  );
}

const runFirst = `
window.document.cookie = 'vipLogin=${process.env.VIP_KEY}';
true; // note: this is required, or you'll sometimes get silent failures
`;

const API_LISTENER = `(function() {
  var open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
      this.addEventListener("load", function() {
          var message = {"url" : url}
          if (url.includes("xcdn") && url.includes("master.m3u8")) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          }
      });
      open.apply(this, arguments);
  };})();
  true;`;

const CustomHeaderWebView = (props) => {
  const { uri, onLoadStart, ...restProps } = props;
  const [currentURI, setURI] = useState(props.source.uri);
  const newSource = { ...props.source, uri: currentURI };

  return (
    <WebView
      {...restProps}
      source={newSource}
      injectedJavaScript={API_LISTENER}
      onShouldStartLoadWithRequest={(request) => {
        // If we're loading the current URI, allow it to load
        if (request.url === currentURI) return true;
        // We're loading a new URL -- change state first
        setURI(request.url);
        return false;
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  castContainer: {
    flex: 1 / 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
