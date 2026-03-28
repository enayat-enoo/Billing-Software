const mongoose = require('mongoose')

const connectDB = async (URI)=>{
    try{
         return await mongoose.connect(URI);
    }catch(error){
        console.log(error);
    }
}

module.exports = connectDB