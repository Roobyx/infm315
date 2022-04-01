// Vendor
import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, Share } from 'react-native'
import { Box, Heading, Text, Image, AspectRatio, Center, Stack, HStack, Button, Modal } from 'native-base'
import 'intl';
import 'intl/locale-data/jsonp/en';

// Firebase
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../../firebaseSetup'
import { linkWithRedirect } from '@firebase/auth'

// Redux
import { useAppDispatch, useAppSelector } from '../../../redux/features/hooks'
import { getUserId } from '../../../redux/features/auth/authSlice'
import { fetchAllReports } from '../../../redux/features/reports/reportOperations'
import { setReports } from '../../../redux/features/reports/reportsSlice'

// Custom
import LoadingIndicator from './LoadingIndicator'
import { Report } from '../../interfaces/interfaces'
import StarRating from 'react-native-star-rating-widget'

type TFeedItem = {
	report: Report
}

const FeedItem = ({report}: TFeedItem) => {
	const userId = useAppSelector(getUserId)
	const dispatch = useAppDispatch()
	const [showModal, setShowModal] = useState(false)
	const [refreshing, setRefreshing] = useState(false)
	const [rating, setRating] = useState(0)

	const updateReports = async () => {
		const fetchedReports = await fetchAllReports()
		const parsedReports = JSON.parse(JSON.stringify(fetchedReports))
		dispatch(setReports(parsedReports))
	}

	let reportLiked = useRef(false)
	let reportRated = useRef(false)

	useEffect(() => {
		if(report.likes) {
			reportLiked.current = report.likes.includes(userId)
		}

		if(report.rates) {
			reportRated.current = report.rates.includes(userId)
		}
	}, [report])

	const onShare = async () => {
		try {
		  const result = await Share.share({
			message: report.reportImage,
		});
		if (result.action === Share.sharedAction) {
				if (result.activityType) {
				// shared with activity type of result.activityType
				} else {
				// shared
				}
			} else if (result.action === Share.dismissedAction) {
			// dismissed
			}
		} catch (error: any) {
			alert(error.message);
		}
	};

	const getTime = (seconds: number) => {
		const time = new Date(Date.UTC(1970, 0, 1))
		time.setSeconds(seconds)
		const monthString = new Intl.DateTimeFormat('bg-BG', {month: 'long'}).format(time)
		const timeString = time.getDate() + ' ' + monthString  + ' ' + time.getHours() + ':' + time.getMinutes()
		return timeString
	}

	const reportTime = getTime(report.timestamp.seconds)

	const likeAction = async (doLike: boolean) => {
		let newLikes = [userId]
		setRefreshing(true)

		if(doLike) {
			if (report.likes.length) {
				newLikes = newLikes.concat(report.likes)
			}
		} else {
			newLikes = newLikes.filter( id => {
				return id !== userId
			})
		}

		try {
			console.log('Trying to amend  data')
			await setDoc(doc(db, "reports", report.reportId), {
				...report,
				likes: newLikes
			})
			
			console.log("Like amended")
			updateReports().then(() => setRefreshing(false))

		} catch(e) {
			console.log('Error in db write: ', e)
			setRefreshing(false)
		}
	}

	const rateAction = async () => {
		let currentRates = [userId]
		let newRating = 0
		setRefreshing(true)

		if(!reportRated.current) {
			if (report.rates.length) {
				console.log('Report already rated')
				currentRates = currentRates.concat(report.rates)
				newRating = ((report.rating * report.rates.length) + rating) / (report.rates.length + 1)
			}

			try {
				console.log('Trying to amend  data')
				await setDoc(doc(db, "reports", report.reportId), {
					...report,
					rates: currentRates,
					rating: newRating
				})
				
				console.log("Report amended")
				updateReports().then(() => setRefreshing(false))

			} catch(e) {
				console.log('Error in db write: ', e)
				setRefreshing(false)
			}
		}
	}

	return (
		<Box
			rounded="lg"
			overflow="hidden"
			width="80"
			shadow={1}
			_light={{ backgroundColor: 'gray.50' }}
			_dark={{ backgroundColor: 'gray.700' }}
			style={{position: 'relative'}}
		>
			{/* zIndex: '100' -> cannot be parsed */}
			{
				refreshing && (
					<LoadingIndicator spinnerOnly={true} style={{position: 'absolute'}}/>
				)
			}
			<Box p='0'>
				<AspectRatio ratio={1 / 1}>
					<Image source={{ uri: report.reportImage, }} alt="image" />
				</AspectRatio>
				
				<Center
					bg="violet.500"
					roundedTopRight='lg'
					_text={{ color: 'white', fontWeight: '700', fontSize: 'xs' }}
					position="absolute"
					bottom={0}
					px="5"
					py="2.5"
				>
					<Text color={'white'}>
						Rating: { Math.round(report.rating * 100) / 100 } / 5
					</Text>
				</Center>

				{
					report.likes && (
						<Center
							bg='emerald.500'
							roundedTopLeft='lg'
							_text={{ color: 'white', fontWeight: '700', fontSize: 'xs' }}
							position="absolute"
							bottom={0}
							right={0}
							px="5"
							py="2.5"
						>
							<Text color={'white'}>
								Likes: { report.likes.length }
							</Text>
						</Center>
					)
				}
			</Box>
		
			<Stack p="4" space={3}>
				<Heading size="md" ml="-1">
					{ report.address }
				</Heading>

				<Text
					fontSize="xs"
					_light={{ color: 'violet.500' }}
					_dark={{ color: 'violet.300' }}
					fontWeight="500"
					ml="-0.5"
					mt="-1"
				>
					{ reportTime }
				</Text>
			</Stack>

			<HStack alignItems="center">
				{/* If report is liked dislike it */}
				<Button rounded='none' w='33.33%' onPress={ () => { reportLiked.current ? likeAction(false) : likeAction(true)}}> 
					{ reportLiked.current ? 'Dislike' : 'Like' }
				</Button>
				<Button rounded='none' w='33.33%' onPress={ () => setShowModal(true) }> 
					{ reportRated.current ? 'Rated' : 'Rate'}
				</Button>
				<Button rounded='none' w='33.33%' onPress={ onShare }> Share </Button>
			</HStack>

			<Modal isOpen={showModal} onClose={() => setShowModal(false)}>
				<Modal.Content maxWidth="400px">
					<Modal.CloseButton />
					<Modal.Header>Rate it</Modal.Header>
				
					<Modal.Body>
						<StarRating
							rating={rating}
							onChange={setRating}
						/>
					</Modal.Body>

					<Modal.Footer>
						<Button.Group space={2}>
							
							<Button
								variant="ghost"
								colorScheme="blueGray"
								onPress={() => setShowModal(false)}
							>
								Cancel
							</Button>

							<Button
								onPress={() => {
									setShowModal(false)
									rateAction()
								}}
							>
								Submit
							</Button>

						</Button.Group>
					</Modal.Footer>
				</Modal.Content>
			</Modal>
		</Box>
	)
}

export default FeedItem

const styles = StyleSheet.create({})