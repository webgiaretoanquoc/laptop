(function ($) {
    $(document).ready(function () {
        var $formWoo = $('.summary.entry-summary > .cart');
        var $formPopup = $('.devvn_prod_variable .cart');
        if($('.devvn_prod_variable').length > 0){
            if($('.devvn_prod_variable .quantity.buttons_added .screen-reader-text').length == 0){
                $('.devvn_prod_variable .quantity.buttons_added').append('<label class="screen-reader-text">Số lượng</label>')
            }
        }
        function sync_variation_to_popup(){
            $('select, input, textarea', $formWoo).each(function () {
                var thisName = $(this).attr('name');
                var thisVal = $(this).val();
                $('[name="'+thisName+'"]',$formPopup).val(thisVal);
            });
            $formPopup.trigger("check_variations");
        }
        function sync_variation_to_woo(){
            $('select, input, textarea', $formPopup).each(function () {
                var thisName = $(this).attr('name');
                var thisVal = $(this).val();
                $('[name="'+thisName+'"]',$formWoo).val(thisVal);
            });
            $formWoo.trigger("check_variations");
        }
        $('.devvn_buy_now').on('click', function () {
            var variation_id = $('.summary.entry-summary > .cart input[name="variation_id"]').val();
            if((typeof variation_id == 'string' && variation_id != '0' && variation_id != '') || typeof variation_id == 'undefined'){
                $('.devvn-popup-quickbuy').bPopup({
                    speed: 450,
                    transition: 'slideDown',
                    zIndex: 9999999,
                    modalClose: false,
                    closeClass: 'devvn-popup-close',
                    onOpen: function () {
                        sync_variation_to_popup();
                    },
                    onClose: function () {
                        sync_variation_to_woo();
                    }
                });
            }else{
                alert(wc_add_to_cart_variation_params.i18n_make_a_selection_text);
            }
        });
        $.validator.addMethod('vietnamphone', function (value, element) {
            return /^0+(\d{9,10})$/.test(value);
        }, "Please enter a valid phone number");
        $.validator.addMethod("customemail",
            function(value, element) {
                if(value == "") return true;
                return /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(value);
            },
            "Sorry, I've enabled very strict email validation"
        );
        var devvn_quickbuy = $(".devvn_cusstom_info");
        devvn_quickbuy.validate({
            rules: {
                'customer-name': {
                    required: true,
                    maxlength: 100
                },
                'customer-phone': {
                    required: {
                        depends:function(){
                            $(this).val($.trim($(this).val()));
                            return true;
                        }
                    },
                    vietnamphone: true
                },
                'customer-email': {
                    /*required: {
                        depends:function(){
                            $(this).val($.trim($(this).val()));
                            return true;
                        }
                    },*/
                    customemail: true
                }
            },
            messages: {
                'customer-name': "Họ tên là bắt buộc",
                'customer-phone': "Số điện thoại là bắt buộc",
                //'customer-email': "Địa chỉ Email là bắt buộc",
            }
        });

        var quickbuy_process = false;
        $('.devvn-order-btn').on('click',function () {
            if(!devvn_quickbuy.valid()) return;
            var prod_nonce = $('#prod_nonce').val();
            var prod_id = $('#prod_id').val();
            var customer_info = $('#devvn_cusstom_info').serialize();
            var product_info = $('.devvn_prod_variable .cart').serialize();
            var variation_id = $('.devvn_prod_variable .cart input[name="variation_id"]').val();
            if((typeof variation_id == 'string' && variation_id != '0' && variation_id != '') || typeof variation_id == 'undefined') {
                if (!quickbuy_process) {
                    $.ajax({
                        type: "post",
                        dataType: "json",
                        url: devvn_quickbuy_array.ajaxurl,
                        data: {
                            action: "devvn_quickbuy",
                            prod_id: prod_id,
                            customer_info: customer_info,
                            product_info: product_info,
                            nonce: prod_nonce
                        },
                        context: this,
                        beforeSend: function () {
                            quickbuy_process = true;
                            $('.devvn-order-btn').addClass('loading');
                        },
                        success: function (response) {
                            //console.log(response);
                            if (response.success) {
                                $('.devvn-popup-content-right').html(response.data.content);
                            }
                            else {
                                alert(devvn_quickbuy_array.popup_error);
                            }
                            quickbuy_process = false;
                            $('.devvn-order-btn').removeClass('loading');
                        }
                    });
                }
            }else{
                alert(wc_add_to_cart_variation_params.i18n_make_a_selection_text);
            }
            return false;
        });
        if($('#devvn_city').length > 0) {
            var loading_billing = false;
            var enable_ship = $('#enable_ship').val();
            $('#devvn_city').on('change', function (e) {
                var matp = e.val;
                if (!matp) matp = $("#devvn_city option:selected").val();
                if (matp && !loading_billing) {
                    loading_billing = true;
                    $.ajax({
                        type: "post",
                        dataType: "json",
                        url: devvn_quickbuy_array.ajaxurl,
                        data: {action: "quickbuy_load_diagioihanhchinh", matp: matp, getvalue: 1},
                        context: this,
                        beforeSend: function () {
                            $('.popup-customer-info').addClass('popup_loading');
                        },
                        success: function (response) {
                            $("#devvn_district").html('');
                            $("#devvn_ward").html('<option value="">Xã/phường</option>');
                            if (response.success) {
                                var listQH = response.data.list_district;
                                var newState = new Option('Quận/huyện', '');
                                $("#devvn_district").append(newState);
                                $.each(listQH, function (index, value) {
                                    var newState = new Option(value.name, value.maqh);
                                    $("#devvn_district").append(newState);
                                });
                                if(enable_ship && response.data.shipping){
                                    $('.popup_quickbuy_shipping_calc').html(response.data.shipping);
                                }
                            }
                            loading_billing = false;
                            $('.popup-customer-info').removeClass('popup_loading');
                        }
                    });
                }
            });
            if($('#devvn_district').length > 0){
                $('#devvn_district').on('change',function(e){
                    var maqh = e.val;
                    if(!maqh) maqh = $( "#devvn_district option:selected" ).val();
                    var matp = $("#devvn_city option:selected").val();
                    if(maqh && !loading_billing) {
                        $.ajax({
                            type: "post",
                            dataType: "json",
                            url: devvn_quickbuy_array.ajaxurl,
                            data: {action: "quickbuy_load_diagioihanhchinh",matp: matp, maqh: maqh, getvalue: 2},
                            context: this,
                            beforeSend: function () {
                                $('.popup-customer-info').addClass('popup_loading');
                            },
                            success: function (response) {
                                $("#devvn_ward").html('');
                                if (response.success) {
                                    var listQH = response.data.list_district;
                                    var newState = new Option('Xã/phường', '');
                                    $("#devvn_ward").append(newState);
                                    $.each(listQH, function (index, value) {
                                        var newState = new Option(value.name, value.xaid);
                                        $("#devvn_ward").append(newState);
                                    });
                                    if(enable_ship && response.data.shipping){
                                        $('.popup_quickbuy_shipping_calc').html(response.data.shipping);
                                    }
                                }
                                loading_billing = false;
                                $('.popup-customer-info').removeClass('popup_loading');
                            }
                        });
                    }
                });
            }
            $(window).on('load', function(){
                $('#devvn_city').trigger('change');
            });
        }
    })
})(jQuery)