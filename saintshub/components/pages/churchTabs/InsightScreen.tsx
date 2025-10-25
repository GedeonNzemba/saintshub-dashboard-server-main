import {  Image, StyleSheet, View, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { CHURCH_DB, shadowProps } from "../../../utilities/tools";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/_layout";
import { Deacons, Pulpit, Trustees } from "../../../utilities/svg";
// import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { Divider, Text } from "react-native-paper";
import Accordance from "../../recycle/Accordance";
import { windowHeight, windowWidth } from "../../../utilities/types";
import { ChurchSermonState, initialState } from "../../../hooks/redux/church/sermons";


type PARAM_DATA_PROPS = {
  data: CHURCH_DB
}

const Insight = () => {
  const route = useRoute();

  let insightData = route?.params as PARAM_DATA_PROPS;

  const [formData, setFormData] = React.useState<ChurchSermonState>(initialState);
  const [loader, setLoader] = useState<boolean>(true);

  const { oldServices, principal, securities } = useSelector((state: RootState) => state.reducer.getChurchSermonData);


  useEffect(() => {
    setFormData({
      ...formData,
      oldServices: oldServices,
      principal: principal,
      securities: securities
    });

    if (formData?.principal.pastor !== undefined) {
      setLoader(false);
    }

    return () => {
      formData?.principal.pastor !== undefined ? setFormData(initialState) : null;
    };
  }, [oldServices, principal, securities, loader]);


  return (
    <ScrollView style={{ height: '100%', backgroundColor: '#ffffff' }}>
      <View style={styles.insightContainer}>
        <View style={styles.insightWrapper}>
          <View style={styles.insightTabHeader}>
            <Text style={styles.insightTabHeaderText}>Insight</Text>
          </View>

          {/* ACCORDANCE START */}
          <Accordance
            title="Pastor & Wife"
            icon={<Pulpit />}
            key={1}
            content={
              <View>
                {!formData?.principal.pastor ? (
                  <Text>No Data</Text>
                ) : (
                  <React.Fragment>
                    <Image
                      source={{ uri: formData?.principal.image }}
                      style={styles.pastorAndWifeImage}
                    />

                    <Text
                      variant="bodyLarge"
                      style={{
                        textAlign: "justify",
                        fontSize: 18,
                      }}
                    >
                      {/* {formData.principal.description} */}

                      {formData.principal.description.split('.').map((phrase, index, array) => {
                        const trimmedPhrase = phrase.trim();
                        const shouldAddFullStop = index !== array.length - 1 && trimmedPhrase.length > 0;
                        return (
                          <React.Fragment key={index}>
                            {trimmedPhrase}
                            {shouldAddFullStop && '.'}
                            {'\n'}{'\n'}{/* Add extra newline for spacing */}
                          </React.Fragment>
                        );
                      })}
                    </Text>
                  </React.Fragment>
                )}
              </View>
            }
          />

          {formData && (
            <>
            {/* {console.log("DEACONS: ", JSON.stringify(formData))} */}
              <Accordance
                title="Our Deacons"
                icon={<Deacons />}
                key={2}
                content={
                  <View>
                    {formData.securities.deacons.map((item, index) => {
                      return (
                        <View key={index} style={{marginBottom: 25}}>
                        <View
                          style={{
                            marginTop: 10,
                            alignItems: "center",
                            shadowColor: "#000",
                            shadowOffset: {
                              width: 0,
                              height: 2,
                            },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,

                            elevation: 5,
                          }}
                        >
                          <Image
                            source={{ uri: item.image }}
                            style={styles.image}
                          />


                           <Text variant="titleLarge" style={styles.insightTitleText}>
                          {item.names}
                        </Text>
                        </View>

                        <View style={{ marginTop: 10 }}>
                          <Text
                            variant="bodyLarge"
                            style={{
                              textAlign: "justify",
                              marginBottom: 10,
                              fontSize: 18,
                            }}
                          >
                            {item.descriptions.split('.').map((phrase, index, array) => {
                      const trimmedPhrase = phrase.trim();
                      const shouldAddFullStop = index !== array.length - 1 && trimmedPhrase.length > 0;
                      return (
                        <React.Fragment key={index}>
                          {trimmedPhrase}
                          {shouldAddFullStop && '.'}
                          {'\n'}{'\n'}{/* Add extra newline for spacing */}
                        </React.Fragment>
                      );
                    })}
                          </Text>
                        </View>

                        <Divider style={{ marginTop: 15, height: 2 }} />
                      </View>
                      )
                    })}
                    {/* <FlatList
                      data={formData?.securities?.deacons}
                      renderItem={({ item, index }) => (
                       
                      )}
                      keyExtractor={(item) => item.names}
                    /> */}
                  </View>
                }
              />

              <Accordance
                title="Our Trustees"
                icon={<Trustees />}
                key={3}
                content={
                  <View>
                    {formData?.securities?.trustees.map((item, index) => {
                      return (
                        <React.Fragment key={index}>
                        <Text
                          variant="bodyLarge"
                          style={styles.insightTitleText}
                        >
                          {item.names}
                        </Text>

                        <View
                          style={{
                            marginTop: 10,
                            alignItems: "center",
                            shadowColor: "#000",
                            shadowOffset: {
                              width: 0,
                              height: 2,
                            },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.84,

                            elevation: 5,
                          }}
                        >
                          <Image
                            source={{ uri: item.image }}
                            style={styles.image}
                          />
                        </View>

                        <Divider style={{ marginTop: 15 }} />
                      </React.Fragment>
                      )
                    })}
                    {/* <FlatList
                      data={formData?.securities?.trustees}
                      renderItem={({ item, index }) => (
                       
                      )}
                      keyExtractor={(item) => item.names}
                    /> */}
                  </View>
                }
              />
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default Insight;

const styles = StyleSheet.create({
  insightContainer: {
    height: "100%",
    backgroundColor: "#ffffff",
    padding: 15,
  },
  insightTabHeader: {
    marginBottom: 5,
  },
  insightTabHeaderText: {
    color: "#000000",
    fontFamily: "RobotoBlack",
    fontSize: 28,
    letterSpacing: -0.165,
  },
  insightHeading: {
    borderBottomColor: "#DE8A68",
    borderBottomWidth: 1,
    borderStyle: "solid",
    paddingBottom: 18,
    marginBottom: 12,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  insightHeadingText: {
    color: "#000000",
    fontFamily: "RobotoCondensedBold",
    fontSize: 20,
    letterSpacing: -0.165,
  },
  insightTitleText: {
    color: "#000000",
    fontFamily: "RobotoMedium",
    //fontSize: 18,
    letterSpacing: -0.165,
    padding: 8,
  },
  insightPastorInfoText: {
    color: "#000000",
    fontFamily: "RobotoRegular",
    fontSize: 18,
    letterSpacing: -0.165,
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: "stretch",
    borderRadius: 50,
  },
  pastorAndWifeImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
    borderRadius: 50,
    marginBottom: 25,
  },
  insightWrapper: {}
});
