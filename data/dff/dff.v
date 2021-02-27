module dff (
    input d,  
    input clk,  
    input resetn,  
    output reg q
    );  
    
    always @ (posedge clk or negedge resetn)  
        if (!resetn)  
            q <= 0;  
        else  
            q <= d; 

endmodule  