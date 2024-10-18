import React, { useEffect, useRef, useState } from 'react';
import CountdownTimer from './CountdownTimer';
import { getUserDoc, createCart } from '../firebaseConfig'; // Import Firebase functions
import ImageSequence from './ImageSequence'; // Import the new scroll image component
import './Home.css';

const Home = () => {
    const [visible, setVisible] = useState({});
    const [userData, setUserData] = useState(null); // Store user data

    const observer = useRef(
        new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setVisible((prevVisible) => ({
                        ...prevVisible,
                        [entry.target.id]: true,
                    }));
                }
            });
        }, { threshold: 0.1 })
    );

    useEffect(() => {
        // Intersection Observer for fading in images
        const elements = document.querySelectorAll('.home-image');
        elements.forEach((element) => {
            observer.current.observe(element);
        });

        return () => {
            elements.forEach((element) => {
                observer.current.unobserve(element);
            });
        };
    }, []);

    // Test Firebase: Fetch user document or create a cart
    useEffect(() => {
        const testFirebaseIntegration = async () => {
            const userId = 'testUserId123'; // Replace with actual userId
            const userDoc = await getUserDoc(userId);

            if (!userDoc) {
                // If no user document exists, create a cart for the user
                await createCart(userId);
                console.log(`Created a cart for user ID: ${userId}`);
            } else {
                setUserData(userDoc); // Store user data
                console.log('User Data:', userDoc);
            }
        };

        testFirebaseIntegration(); // Call the function to test Firebase
    }, []);

    return (
        <div className="home-container">
            <h1 className="welcome-message">Welcome to Dan Ober Artisan Drums!</h1>

            {/* Video section */}
            <div className="video-container">
                <video
                    className="coming-soon-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                >
                    <source src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/Home%2Fcomingsoon2.mp4?alt=media&token=31ad46c4-2d4c-447a-821e-13547a75a46f" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <CountdownTimer />
            </div>

            {/* Scroll Image Sequence Section */}
            <ImageSequence />

            <div className="home-content">
                {userData && <p className="user-info">Welcome back, {userData.name}!</p>} {/* Display user data */}

                <div className="home-section">
                    <img
                        src="https://i.imgur.com/248CyuT.jpeg"
                        alt="Shop 1"
                        className={`home-image ${visible['image1'] ? 'fade-in' : ''}`}
                        id="image1"
                    />
                    <p className="home-paragraph">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit...
                    </p>
                </div>
                {/* Add other sections here... */}
            </div>
        </div>
    );
};

export default Home;
