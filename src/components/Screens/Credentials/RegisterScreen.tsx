// Vendor
import React, { useState } from 'react'
import { Button } from 'react-native'
import firebase from 'firebase'


// Components
// Atoms
import Input from '../../Atoms/Input'

// Templates
import BasicTemplate from '../../Templates/BasicTemplate'



const RegisterScreen: React.FC<Page> = ({navigation}) => {

	const [state, setState] = useState({
		email: '',
		password: '',
		passwordVerify: ''
	})

	const onSignup = async () => {
		// TODO: verify passwords match first

		const { email, password } = state
		const res = await firebase.auth().createUserWithEmailAndPassword(email, password)
		
		console.log('onSignUp')
	}

	return (
		<BasicTemplate list={false}>
			<Input
				onChangeText={(email) => setState({...state, email })}
				// value={value}
				placeholder="Username"
				keyboardType="default"
			/>

			<Input
				onChangeText={(password) => setState({...state, password })}
				// value={value}
				placeholder="Password"
				secure
				keyboardType="visible-password"
			/>

			<Input
				onChangeText={(passwordVerify) => setState({...state, passwordVerify })}
				// value={value}
				placeholder="Repeat password"
				secure
				keyboardType="visible-password"
			/>

			<Button title="Complete account" onPress={onSignup} />
		</BasicTemplate>
	)
}


export default RegisterScreen
