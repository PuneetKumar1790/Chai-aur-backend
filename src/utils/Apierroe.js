class ApiError extends Error {
    constructor(
        statuscode,
        message="Something went wrong ",
        errors=[],
        stack=""
    ){
        super(message)      //OVERWRITING
        this.statuscode=statuscode
        this.data=null
        this.message=message
        this.success=false;
        this.errors=errors


        if(stack){
            this.stacke=stack}
            else{
                Error.captureStackTrace(this,this.constructor)
            }

    }
}

export{ApiError}