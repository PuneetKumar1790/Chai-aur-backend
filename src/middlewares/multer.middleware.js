import multer from "multer";

//using disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp') //files in public folder
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
export  const upload = multer({ 
    storage,
})