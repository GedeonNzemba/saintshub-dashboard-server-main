import * as React from 'react';
import { useCallback, useRef, useMemo, useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../app/_layout";
import Loader from "../../sections/Loader";
import { getRandomColor } from "../../../tools/randomColor";
import Spacer from "../../../tools/Spacer";
import Stream from "../../sections/Stream";
import { hideLiveModal } from "../../../hooks/redux/liveModal";
import LiveIconA from '../../sections/LiveIconA';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';

interface IProps {
    modalVisible: boolean;
    live: {
        title: string;
        preacher: string;
        sermon: string;
    }[];
    churhName: string;
}

const initializeState: IProps = {
    churhName: '',
    modalVisible: false,
    live: [{ preacher: '', sermon: '', title: '' }]
};

const LiveModal = () => {
    const dispatch = useDispatch();

    const [isLoading, setIsLoading] = useState(true);
    const [state, setState] = useState<IProps>(initializeState);

    const { modalVisible, live, churhName } = useSelector((state: RootState) => state.reducer.liveModal);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["25%", "50%", "80%"], []);

    const renderBackdrop = useCallback(
        (props: React.JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
            />
        ),
        []
    );

    const handleClose = () => {
        dispatch(hideLiveModal());
        console.log("CLOSED_MODAL");
    };

    useEffect(() => {
        setState({ churhName, modalVisible, live });
    }, [modalVisible, live, churhName]);

    useEffect(() => {
        if (state.churhName.trim().length !== 0 && state.modalVisible && state.live.length !== 0) {
            setIsLoading(false);
        }
    }, [state]);

    return (
        <BottomSheet
            ref={bottomSheetRef}
            snapPoints={snapPoints}
            index={0}
            detached={true}
            bottomInset={50}
            backdropComponent={renderBackdrop}
            onClose={handleClose}
            style={styles.sheetContainer}
        >
             <View style={styles.fixedContainer}>
                    <Text style={styles.fixedHeader}>Emmanual Gospel Center</Text>
                    <LiveIconA />
                </View>
            <BottomSheetScrollView contentContainerStyle={[styles.wrapper, isLoading && { justifyContent: 'center', alignItems: 'center' }]}>
           
                {isLoading && (
                    <View style={{ width: 150, height: 150 }}>
                        <Loader />
                    </View>
                )}


                {!isLoading && (
                    <>
                        {state.live.map((item, index) => {
                            const randomColor = getRandomColor();
                            return (
                                <View key={index} style={{ padding: 15, marginBottom: 25, borderRadius: 25, borderWidth: 1.5, borderColor: randomColor }}>
                                    {/* <View style={styles.container}>
                                        <Text style={styles.heading}>Church</Text>
                                        <Text style={styles.props}>{state.churhName}</Text>
                                    </View> */}

                                    <View style={styles.container}>
                                        <Text style={styles.heading}>Sermon</Text>
                                        <Text style={styles.props}>{item.title}</Text>
                                    </View>
                                    <Spacer />
                                    <Stream title={item.title} sermonURL={item.sermon} preacher={item.preacher} />
                                </View>
                            )
                        })}
                    </>
                )}
            </BottomSheetScrollView>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    fixedContainer: {
        padding: 20,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    fixedHeader: {
        fontFamily: "RobotoBlack",
        fontSize: 18,
        letterSpacing: 0.5,
        color: "#000000",
        textTransform: "uppercase",
    },
    container: {
        flex: 1,
        paddingTop: 20,
    },
    wrapper: {
        padding: 15,
        display: 'flex',
        flexDirection: 'column',
    },
    sheetContainer: {
        marginHorizontal: 24,
    },
    heading: {
        fontFamily: "RobotoCondensedBold",
        fontSize: 18,
        letterSpacing: 0.5,
        color: "#000000",
        textTransform: "uppercase",
        marginRight: 16,
    },
    props: {
        fontFamily: "RobotoRegular",
        fontSize: 16,
        color: "#000000",
        textTransform: "capitalize",
    },
});

export default LiveModal;
