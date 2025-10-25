import { FlatList, Image, StyleSheet, View, ScrollView } from "react-native";
import React from "react";
import {  shadowProps } from "../../../utilities/tools";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/_layout";
import { Pastor } from "../../../utilities/svg";
// import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { Divider, Text } from "react-native-paper";
import deacon from "../../../images/church/deacons.png";
import trustees from "../../../images/church/trustees.png";
import Accordance from "../../recycle/Accordance";


const Insight = () => {
  const { description, churchOrder, pastorAndWife } = useSelector((state: RootState) => state.reducer.churchTabSlice.data);

  return (
    <ScrollView>
      <View style={styles.insightContainer}>
        <View>
          {/* HEADING */}
          <View style={styles.insightTabHeader}>
            <Text style={styles.insightTabHeaderText}>Insight</Text>
          </View>

          {/* ACCORDANCE START */}
          <Accordance
            title="Pastor & Wife"
            icon={<Pastor />}
            content={
              <View>
                {description.includes("undefined") ? (
                  <Text>No description data</Text>
                ) : (
                  <React.Fragment>
                    <Image source={{ uri: pastorAndWife }} style={styles.pastorAndWifeImage} />

                    <Text
                      variant="bodyLarge"
                      style={{
                        textAlign: "justify",
                        marginBottom: 10,
                        fontSize: 20,
                      }}
                    >
                      {description}
                    </Text>
                  </React.Fragment>
                )}
              </View>
            }
          />

          <Accordance
            title="Our Deacons"
            icon={
              <Image
                source={deacon}
                style={{
                  width: 40,
                  height: 40,
                  position: "absolute",
                  top: "10%",
                  left: "8%",
                }}
              />
            }
            content={
              <View>
                {churchOrder && (
                  <FlatList
                    data={churchOrder.deacons.names}
                    renderItem={({ item, index }) => (
                      <React.Fragment>
                        <Text variant="bodyLarge" style={styles.insightTitleText}>
                          {item}
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
                          <Image key={index} source={{ uri: churchOrder.deacons.images[index] }} style={styles.image} />
                        </View>

                        <View style={{ marginTop: 10 }}>
                          <Text
                            variant="bodyLarge"
                            style={{
                              textAlign: "justify",
                              marginBottom: 10,
                            }}
                          >
                            {churchOrder.deacons.descriptions[index]}
                          </Text>
                        </View>

                        <Divider style={{ marginTop: 15 }} />
                      </React.Fragment>
                    )}
                    keyExtractor={(item) => item}
                  />
                )}
              </View>
            }
          />

          <Accordance
            title="Our Trustees"
            icon={
              <Image
                source={trustees}
                style={{
                  width: 40,
                  height: 40,
                  position: "absolute",
                  top: "10%",
                  left: "8%",
                }}
              />
            }
            content={
              <View>
                {churchOrder && (
                  <FlatList
                    data={churchOrder.trustees.names}
                    renderItem={({ item, index }) => (
                      <React.Fragment>
                        <Text variant="bodyLarge" style={styles.insightTitleText}>
                          {item}
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
                          <Image key={index} source={{ uri: churchOrder.trustees.images[index] }} style={styles.image} />
                        </View>

                        <Divider style={{ marginTop: 15 }} />
                      </React.Fragment>
                    )}
                    keyExtractor={(item) => item.id}
                  />
                )}
              </View>
            }
          />
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
  },
});
