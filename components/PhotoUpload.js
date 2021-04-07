import axios from 'axios'
import React from 'react'

import { WidgetLoader, Widget } from 'react-cloudinary-upload-widget'
// userOrEvent = 'user' or 'event'
const UploadWidget = ({userOrEvent, id }) => {

  const storePhoto = (photoUrl, id) => {
      axios.post(`localhost:4000/photos/${userOrEvent}/${id}`, photoUrl)
      .then((response) => {
          console.log(response);
      }, (error) => {
          console.log(error);
      })
  }

  return (
    <>
      <WidgetLoader /> 
      <Widget
        resourceType={'image'}
        cloudName={'attendeaze'}
        uploadPreset={'preset1'} 
        buttonText={'Upload Image'} 
        id='cloudinary-upload-button'
        folder={'attendeaze'} 
        onSuccess={(results) => storePhoto(results, id)}
        onFailure={(err) => console.log(err)}   
        logging={false}
        />
    </>
  )
}

export default UploadWidget;