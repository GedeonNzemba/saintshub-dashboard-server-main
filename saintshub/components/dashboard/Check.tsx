// import React, { useRef, useEffect, useState } from 'react';
// import { TextInput } from 'react-native-paper';

// const YourComponent: React.FC = () => {
//   const textInputRef = useRef<typeof TextInput | null>(null);
//   const [isDisabled, setDisabled] = useState(true);

//   useEffect(() => {
//     // Accessing the current disabled value
//     console.log('Current disabled value:', isDisabled);
//   }, [isDisabled]);

//   const handleToggleDisabled = () => {
//     setDisabled((prevDisabled) => !prevDisabled);
//   };

//   return (
//     <>
//       <TextInput
//         ref={textInputRef}
//         disabled={isDisabled}
//         label="InputTitle"
//         value="value"
//       />
//       <YourButton onPress={handleToggleDisabled} />
//     </>
//   );
// };

// interface YourButtonProps {
//   onPress: () => void;
// }

// const YourButton: React.FC<YourButtonProps> = ({ onPress }) => {
//   return (
//     // Assuming you have a button to toggle the disabled state
//     <YourButtonComponent onPress={onPress} />
//   );
// };

// export default YourComponent;
