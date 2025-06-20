import { useState, useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import openDB from "./db";

const db = openDB();

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false); // variável para controle do darkMode
  const [isLoading, setIsLoading] = useState(false); // variável para controle do loading do button
  const [locations, setLocations] = useState(null); // variável para armazenar as localizações
  const [errorMsg, setErrorMsg] = useState(null);

  // Carrega tema default da lib RN PAPER com customização das cores. Para customizar o tema, veja:
  // https://callstack.github.io/react-native-paper/docs/guides/theming/#creating-dynamic-theme-colors
  const [theme, setTheme] = useState({
    ...DefaultTheme,
    myOwnProperty: true,
    colors: myColors.colors,
  });

  const salvarDarkMode = async (value) => {
    try {
    await AsyncStorage.setItem('@darkMode', String(value))
    } catch ( e ) {
      console.error('Erro ao salvar dark mode:', e);
    }
    }

    const getDarkMode = async ( ) => {
      try {
      const value = await AsyncStorage.getItem('@darkMode')
      if(value !== null) {
        return value === 'true';
      }
      } catch (e) {
        console.error('Erro ao carregar dark mode:', e);
      }
      }
      

  // load darkMode from AsyncStorage
  async function loadDarkMode() {
    const isDark = await getDarkMode();
    setIsSwitchOn(isDark);
  }

  // darkMode switch event
  async function onToggleSwitch() {
    const novoValor = !isSwitchOn;
    await salvarDarkMode(novoValor);
    setIsSwitchOn(novoValor);
  }

  // get location (bottao capturar localização)
  async function getLocation() {
    setIsLoading(true);

    console.log("Solicitando permissão...");
    let { status } = await Location.requestForegroundPermissionsAsync();
    console.log("Status da permissão:", status);

    if (status !== 'granted') {
      setErrorMsg('Permissão de localização negada.');
      setIsLoading(false)
      return;
    }

    console.log("Obtendo localização...");
    let location = await Location.getCurrentPositionAsync({});
    console.log("Localização obtida:", location);

    const { latitude, longitude } = location.coords;

    try {
      await db.runAsync(
        "INSERT INTO locations (latitude, longitude) VALUES (?, ?);",
        [latitude, longitude]
      );
      console.log("Localização salva no banco.");
      await loadLocations();
    } catch (error) {
      console.error("Erro ao inserir localização:", error);
    }
  
    setIsLoading(false);
  }

  // load locations from db sqlite - faz a leitura das localizações salvas no banco de dados
  async function loadLocations() {
    try {
      const allRows = await db.getAllAsync("SELECT * FROM locations ORDER BY id DESC;");
      console.log("Localizações carregadas:", allRows);
      setLocations(allRows);
    } catch (error) {
      console.error("Erro ao carregar localizações:", error);
    }
  }

  // Use Effect para carregar o darkMode e as localizações salvas no banco de dados
  // É executado apenas uma vez, quando o componente é montado
  useEffect(() => {
    loadDarkMode();
    loadLocations();
  }, []);

  // Efetiva a alteração do tema dark/light quando a variável isSwitchOn é alterada
  // É executado sempre que a variável isSwitchOn é alterada
  useEffect(() => {
    if (isSwitchOn) {
      setTheme({ ...theme, colors: myColorsDark.colors });
    } else {
      setTheme({ ...theme, colors: myColors.colors });
    }
  }, [isSwitchOn]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.containerDarkMode}>
          <Text>Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map"
          mode="contained"
          loading={isLoading}
          onPress={() =>  {
            console.log("Botão pressionado");
            getLocation();
          }}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          renderItem={({ item }) => (
            <List.Item
              title={`Localização ${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}`}
            ></List.Item>
          )}
        ></FlatList>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  containerDarkMode: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    margin: 10,
  },
  containerList: {
    margin: 10,
    height: "100%",
  },
});
