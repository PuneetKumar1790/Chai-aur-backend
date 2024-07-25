// building a wrapper function to use it many times by promises
const asyncHandler=(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}





export{asyncHandler}



//building a wrapper function to use it many times by async await
// const asyncHandler=(fn)=> async (req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code||500).json({
//             success:false,
//             meaasge:err.message
//         })
//     }
// }// passing function to another function 