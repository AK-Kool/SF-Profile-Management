import { LightningElement, wire } from 'lwc';
import PROFILE_CHANNEL from '@salesforce/messageChannel/ProfileChannel__c';
import { publish,subscribe, MessageContext } from 'lightning/messageService';

export default class TestLwc extends LightningElement 
{
    subscription = null;

    isVisible = false;

    @wire(MessageContext)
    messageContext;

    // handleClick()
    // {
    //     alert(this);
    //     let o1 = this.template.querySelector('[data-id="abcd"]');
    //     //alert(JSON.stringify(o1));
    //     o1.age = 15;
    // }
    connectedCallback(){
        this.isVisible = true;
        if(!this.subscription)
        {
            this.subscription = subscribe(
                this.messageContext,
                PROFILE_CHANNEL,
                (payload) => this.handlePayload(payload)
            );
        }
    }
    handlePayload(payload)
    {
        if(payload.isVisible === true)
            this.isVisible = true;
        else if(payload.isVisible === false)
            this.isVisible = false;
                
    }
}